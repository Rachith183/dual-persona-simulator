/**
 * ADVANCED CHARACTER LAYER ANIMATION ENGINE
 * Manages complex layer blending, expression states, and smooth transitions
 */

class CharacterLayerAnimator {
    constructor(containerSelector = '.character-layer') {
        this.container = document.querySelector(containerSelector);
        this.currentExpression = 'neutral';
        this.currentEyeState = 'open';
        this.currentMouthState = 'neutral';
        this.isAnimating = false;
        this.layers = {};
        this.expressionTransitionSpeed = 0.3; // seconds
        
        this.initialize();
    }

    /**
     * Initialize animation system
     */
    initialize() {
        console.log('🎨 Initializing Character Layer Animator');
        this.setupLayerReferences();
        this.attachEventListeners();
        this.startIdleAnimation();
    }

    /**
     * Setup references to layer elements
     */
    setupLayerReferences() {
        this.layers = {
            eyeLeft: this.container?.querySelector('.layer-eye-left'),
            eyeRight: this.container?.querySelector('.layer-eye-right'),
            mouth: this.container?.querySelector('.layer-mouth'),
            hairBack: this.container?.querySelector('.layer-hair-back'),
            hairStrand: this.container?.querySelector('.layer-hair-strand'),
            bang: this.container?.querySelector('.layer-bang'),
            base: this.container?.querySelector('.layer-base'),
        };
    }

    /**
     * Set character expression with smooth transition
     */
    setExpression(expressionName) {
        if (this.currentExpression === expressionName) return;

        console.log(`🎭 Changing expression: ${this.currentExpression} → ${expressionName}`);

        if (this.container) {
            // Remove old expression class
            this.container.classList.remove(`state-${this.currentExpression}`);
            
            // Add transition class
            this.container.classList.add('layer-transition-fade-out');

            setTimeout(() => {
                // Add new expression class
                this.container.classList.add(`state-${expressionName}`);
                this.container.classList.remove('layer-transition-fade-out');
                this.container.classList.add('layer-transition-fade-in');

                setTimeout(() => {
                    this.container.classList.remove('layer-transition-fade-in');
                }, 400);
            }, 100);
        }

        this.currentExpression = expressionName;
    }

    /**
     * Control eye animation states
     */
    setEyeState(state) {
        if (this.currentEyeState === state) return;

        console.log(`👁️ Eye state: ${state}`);

        const eyeElements = [this.layers.eyeLeft, this.layers.eyeRight];
        
        eyeElements.forEach(eye => {
            if (!eye) return;

            eye.classList.remove('eye-open', 'eye-half-closed', 'eye-full-closed');

            switch(state) {
                case 'open':
                    eye.classList.add('eye-open');
                    eye.style.animation = 'blink-cycle 4s infinite';
                    break;
                case 'half-closed':
                    eye.classList.add('eye-half-closed');
                    eye.style.animation = 'none';
                    break;
                case 'closed':
                    eye.classList.add('eye-full-closed');
                    eye.style.animation = 'none';
                    break;
            }
        });

        this.currentEyeState = state;
    }

    /**
     * Control mouth states
     */
    setMouthState(state) {
        if (!this.layers.mouth) return;

        console.log(`👄 Mouth state: ${state}`);

        this.layers.mouth.classList.remove('smile', 'angry', 'neutral', 'speaking');
        this.layers.mouth.classList.add(state);

        this.currentMouthState = state;
    }

    /**
     * Trigger eye look direction
     */
    lookDirection(direction) {
        const eyeElements = [this.layers.eyeLeft, this.layers.eyeRight];
        
        eyeElements.forEach(eye => {
            if (!eye) return;
            eye.classList.remove('looking-left', 'looking-right');
            
            if (direction === 'left') {
                eye.classList.add('looking-left');
            } else if (direction === 'right') {
                eye.classList.add('looking-right');
            }
        });
    }

    /**
     * Trigger mouth speaking animation
     */
    triggerSpeaking() {
        if (!this.layers.mouth) return;

        this.layers.mouth.classList.add('speaking');
    }

    /**
     * Stop speaking animation
     */
    stopSpeaking() {
        if (!this.layers.mouth) return;

        this.layers.mouth.classList.remove('speaking');
    }

    /**
     * Trigger reaction animations
     */
    triggerReaction(reactionType) {
        if (!this.container) return;

        console.log(`⚡ Reaction triggered: ${reactionType}`);

        const reactionClass = `reaction-${reactionType}`;
        this.container.classList.add(reactionClass);

        setTimeout(() => {
            this.container.classList.remove(reactionClass);
        }, 700);
    }

    /**
     * Start idle/breathing animation
     */
    startIdleAnimation() {
        // Gentle floating animation for the entire layer
        if (this.container) {
            this.container.classList.add('layer-3d-depth');
        }
    }

    /**
     * Rapid blink animation
     */
    blink() {
        const eyeElements = [this.layers.eyeLeft, this.layers.eyeRight];
        
        eyeElements.forEach(eye => {
            if (!eye) return;
            
            eye.style.animation = 'none';
            setTimeout(() => {
                eye.style.opacity = '0';
            }, 50);
            setTimeout(() => {
                eye.style.opacity = '1';
                eye.style.animation = 'blink-cycle 4s infinite';
            }, 150);
        });
    }

    /**
     * Set layer blend mode
     */
    setLayerBlendMode(layerName, blendMode) {
        const layer = this.layers[layerName];
        if (layer) {
            layer.style.mixBlendMode = blendMode;
        }
    }

    /**
     * Animate expression sequence (for demos/cutscenes)
     */
    async playExpressionSequence(expressions, duration = 2000) {
        for (const expression of expressions) {
            this.setExpression(expression);
            await new Promise(resolve => setTimeout(resolve, duration));
        }
    }

    /**
     * Animate eye gaze sequence
     */
    async playGazeSequence(gazePoints, duration = 1000) {
        for (const direction of gazePoints) {
            this.lookDirection(direction);
            await new Promise(resolve => setTimeout(resolve, duration));
        }
    }

    /**
     * Compose complex animation routine
     */
    async playComplexRoutine(routine) {
        for (const step of routine) {
            const { action, target, duration } = step;

            if (action === 'expression') {
                this.setExpression(target);
            } else if (action === 'eye-state') {
                this.setEyeState(target);
            } else if (action === 'mouth-state') {
                this.setMouthState(target);
            } else if (action === 'look') {
                this.lookDirection(target);
            } else if (action === 'reaction') {
                this.triggerReaction(target);
            } else if (action === 'speak-start') {
                this.triggerSpeaking();
            } else if (action === 'speak-stop') {
                this.stopSpeaking();
            }

            await new Promise(resolve => setTimeout(resolve, duration));
        }
    }

    /**
     * Reset to neutral state
     */
    reset() {
        console.log('🔄 Resetting character to neutral state');

        this.setExpression('neutral');
        this.setEyeState('open');
        this.setMouthState('neutral');
        this.stopSpeaking();
        
        const eyeElements = [this.layers.eyeLeft, this.layers.eyeRight];
        eyeElements.forEach(eye => {
            if (eye) {
                eye.classList.remove('looking-left', 'looking-right');
            }
        });
    }

    /**
     * Attach event listeners for user interactions
     */
    attachEventListeners() {
        // Example: Trigger reactions on user input
        document.addEventListener('keypress', (e) => {
            if (e.key === 'h') this.triggerReaction('happy');
            if (e.key === 's') this.triggerReaction('sad');
            if (e.key === 'c') this.triggerReaction('confused');
            if (e.key === 'e') this.triggerReaction('excited');
        });

        // Example: Test expression changes
        document.addEventListener('keypress', (e) => {
            if (e.key === '1') this.setExpression('smiling');
            if (e.key === '2') this.setExpression('angry');
            if (e.key === '3') this.setExpression('thinking');
            if (e.key === '4') this.setExpression('focused');
            if (e.key === '5') this.setExpression('surprised');
        });
    }

    /**
     * Destroy animator instance
     */
    destroy() {
        console.log('🗑️ Destroying Character Layer Animator');
        this.reset();
        // Cleanup can be added here
    }
}

/**
 * Expression presets for common character states
 */
const ExpressionPresets = {
    neutral: {
        expression: 'neutral',
        eyeState: 'open',
        mouthState: 'neutral',
    },
    happy: {
        expression: 'smiling',
        eyeState: 'open',
        mouthState: 'smile',
    },
    angry: {
        expression: 'angry',
        eyeState: 'open',
        mouthState: 'angry',
    },
    thinking: {
        expression: 'thinking',
        eyeState: 'half-closed',
        mouthState: 'neutral',
    },
    focused: {
        expression: 'focused',
        eyeState: 'open',
        mouthState: 'neutral',
    },
    sleeping: {
        expression: 'neutral',
        eyeState: 'closed',
        mouthState: 'neutral',
    },
    surprised: {
        expression: 'surprised',
        eyeState: 'open',
        mouthState: 'neutral',
    },
    talking: {
        expression: 'smiling',
        eyeState: 'open',
        mouthState: 'speaking',
    },
};

/**
 * Example animation routines
 */
const AnimationRoutines = {
    greetingRoutine: [
        { action: 'expression', target: 'smiling', duration: 500 },
        { action: 'mouth-state', target: 'smile', duration: 300 },
        { action: 'look', target: 'right', duration: 500 },
        { action: 'look', target: 'left', duration: 500 },
        { action: 'look', target: 'left', duration: 0 },
        { action: 'reaction', target: 'happy', duration: 600 },
    ],

    thinkingRoutine: [
        { action: 'expression', target: 'thinking', duration: 1000 },
        { action: 'eye-state', target: 'half-closed', duration: 500 },
        { action: 'look', target: 'left', duration: 1000 },
        { action: 'look', target: 'right', duration: 1000 },
        { action: 'look', target: 'left', duration: 0 },
    ],

    confusedRoutine: [
        { action: 'expression', target: 'thinking', duration: 500 },
        { action: 'reaction', target: 'confused', duration: 700 },
        { action: 'mouth-state', target: 'neutral', duration: 500 },
    ],

    excitedRoutine: [
        { action: 'expression', target: 'smiling', duration: 300 },
        { action: 'reaction', target: 'excited', duration: 400 },
        { action: 'mouth-state', target: 'smile', duration: 300 },
    ],
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CharacterLayerAnimator,
        ExpressionPresets,
        AnimationRoutines,
    };
}
