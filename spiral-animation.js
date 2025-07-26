// Squares Grid Animation Background
class SquaresAnimation {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.animationId = null;
        
        // Configuration options
        this.direction = options.direction || 'right';
        this.speed = options.speed || 1;
        this.borderColor = options.borderColor || '#333';
        this.squareSize = options.squareSize || 40;
        this.hoverFillColor = options.hoverFillColor || '#222';
        
        // Grid state
        this.numSquaresX = 0;
        this.numSquaresY = 0;
        this.gridOffset = { x: 0, y: 0 };
        this.hoveredSquare = null;
        
        this.setupCanvas();
        this.setupEventListeners();
        this.startAnimation();
    }
    
    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.canvas.style.background = '#060606';
        
        this.resizeCanvas();
    }
    
    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.numSquaresX = Math.ceil(this.canvas.width / this.squareSize) + 1;
        this.numSquaresY = Math.ceil(this.canvas.height / this.squareSize) + 1;
    }
    
    setupEventListeners() {
        // Mouse move handler
        this.handleMouseMove = (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            
            const startX = Math.floor(this.gridOffset.x / this.squareSize) * this.squareSize;
            const startY = Math.floor(this.gridOffset.y / this.squareSize) * this.squareSize;
            
            const hoveredSquareX = Math.floor(
                (mouseX + this.gridOffset.x - startX) / this.squareSize
            );
            const hoveredSquareY = Math.floor(
                (mouseY + this.gridOffset.y - startY) / this.squareSize
            );
            
            this.hoveredSquare = { x: hoveredSquareX, y: hoveredSquareY };
        };
        
        // Mouse leave handler
        this.handleMouseLeave = () => {
            this.hoveredSquare = null;
        };
        
        // Resize handler
        this.handleResize = () => {
            this.resizeCanvas();
        };
        
        // Add event listeners
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
        window.addEventListener('resize', this.handleResize);
    }
    
    drawGrid() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const startX = Math.floor(this.gridOffset.x / this.squareSize) * this.squareSize;
        const startY = Math.floor(this.gridOffset.y / this.squareSize) * this.squareSize;
        
        this.ctx.lineWidth = 0.5;
        
        for (let x = startX; x < this.canvas.width + this.squareSize; x += this.squareSize) {
            for (let y = startY; y < this.canvas.height + this.squareSize; y += this.squareSize) {
                const squareX = x - (this.gridOffset.x % this.squareSize);
                const squareY = y - (this.gridOffset.y % this.squareSize);
                
                // Check if this square is hovered
                if (
                    this.hoveredSquare &&
                    Math.floor((x - startX) / this.squareSize) === this.hoveredSquare.x &&
                    Math.floor((y - startY) / this.squareSize) === this.hoveredSquare.y
                ) {
                    this.ctx.fillStyle = this.hoverFillColor;
                    this.ctx.fillRect(squareX, squareY, this.squareSize, this.squareSize);
                }
                
                // Draw square border
                this.ctx.strokeStyle = this.borderColor;
                this.ctx.strokeRect(squareX, squareY, this.squareSize, this.squareSize);
            }
        }
        
        // Apply radial gradient overlay
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2,
            this.canvas.height / 2,
            0,
            this.canvas.width / 2,
            this.canvas.height / 2,
            Math.sqrt(Math.pow(this.canvas.width, 2) + Math.pow(this.canvas.height, 2)) / 2
        );
        gradient.addColorStop(0, 'rgba(6, 6, 6, 0)');
        gradient.addColorStop(1, '#060606');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    updateAnimation() {
        const effectiveSpeed = Math.max(this.speed, 0.1);
        
        switch (this.direction) {
            case 'right':
                this.gridOffset.x = (this.gridOffset.x - effectiveSpeed + this.squareSize) % this.squareSize;
                break;
            case 'left':
                this.gridOffset.x = (this.gridOffset.x + effectiveSpeed + this.squareSize) % this.squareSize;
                break;
            case 'up':
                this.gridOffset.y = (this.gridOffset.y + effectiveSpeed + this.squareSize) % this.squareSize;
                break;
            case 'down':
                this.gridOffset.y = (this.gridOffset.y - effectiveSpeed + this.squareSize) % this.squareSize;
                break;
            case 'diagonal':
                this.gridOffset.x = (this.gridOffset.x - effectiveSpeed + this.squareSize) % this.squareSize;
                this.gridOffset.y = (this.gridOffset.y - effectiveSpeed + this.squareSize) % this.squareSize;
                break;
        }
        
        this.drawGrid();
        this.animationId = requestAnimationFrame(() => this.updateAnimation());
    }
    
    startAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.updateAnimation();
    }
    
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    destroy() {
        this.stopAnimation();
        
        // Remove event listeners
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
        window.removeEventListener('resize', this.handleResize);
    }
    
    // Method to update configuration
    updateConfig(newOptions) {
        Object.assign(this, newOptions);
    }
}

// Global variable to store the animation instance
let squaresAnimationInstance = null;

// Initialize the squares background animation
function initSpiralBackground() {
    const canvas = document.getElementById('background-canvas');
    if (!canvas) {
        console.error('Background canvas not found');
        return;
    }
    
    // Clean up existing animation if any
    if (squaresAnimationInstance) {
        squaresAnimationInstance.destroy();
    }
    
    // Create new squares animation with default settings
    squaresAnimationInstance = new SquaresAnimation(canvas, {
        direction: 'diagonal',
        speed: 0.8,
        borderColor: '#333',
        squareSize: 40,
        hoverFillColor: '#222'
    });
}

// Function to update animation settings (for potential future use)
function updateAnimationSettings(options) {
    if (squaresAnimationInstance) {
        squaresAnimationInstance.updateConfig(options);
    }
}

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SquaresAnimation, initSpiralBackground, updateAnimationSettings };
}