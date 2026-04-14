/**
 * game.js (Refactored for Tetromino Block Puzzle)
 * copy index.html dist\index.html; copy style.css dist\style.css; copy ui.js dist\ui.js
 */

const GameState = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER'
};

const BLOCK_POOL = {
    // Classic Tetrominoes (rotatable: true by default)
    I: { shape: [[1, 1, 1, 1]], color: '#00f2ff', rotatable: true },
    O: { shape: [[1, 1], [1, 1]], color: '#ff9d00', rotatable: false }, // Square O technically rotatable but visually same
    T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#7000ff', rotatable: true },
    L: { shape: [[1, 0], [1, 0], [1, 1]], color: '#ff007a', rotatable: true },
    J: { shape: [[0, 1], [0, 1], [1, 1]], color: '#0066ff', rotatable: true },
    S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#00ff62', rotatable: true },
    Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#ff3333', rotatable: true },

    // Special/Rescue Blocks
    SINGLE: { shape: [[1]], color: '#ffffff', rotatable: false },
    DOUBLE: { shape: [[1, 1]], color: '#aaff00', rotatable: true },
    TRIPLE: { shape: [[1, 1, 1]], color: '#ffff00', rotatable: true },
    R_SHAPE: { shape: [[1, 1], [1, 0], [1, 0]], color: '#ff00ff', rotatable: true },
    MEGA_3X3: { shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: '#ffd700', rotatable: false }
};

const SPAWN_WEIGHTS = {
    TETROMINO: 65,
    SINGLE: 10,
    DOUBLE: 8,
    TRIPLE: 7,
    R_SHAPE: 7,
    MEGA_3X3: 3
};

const Game = {
    state: GameState.MENU,
    gridSize: 8,
    grid: [],
    cellSize: 0,
    canvas: null,
    ctx: null,
    dragCanvas: null,
    dragCtx: null,
    score: 0,
    lastCombo: 0,
    startTime: 0,
    lastTime: 0,

    inventory: [null, null, null],
    selectedIndex: -1,

    // For drag-drop feedback
    dragX: 0,
    dragY: 0,
    isDragging: false,
    hasMoved: false,
    dragStartPos: { x: 0, y: 0 },
    dragOffsetY: 100,

    init: function () {
        console.log("Game: Initializing...");
        try {
            this.canvas = document.getElementById('game-canvas');
            if (!this.canvas) throw new Error("Canvas not found");

            this.ctx = this.canvas.getContext('2d');

            this.dragCanvas = document.getElementById('drag-canvas');
            if (this.dragCanvas) {
                this.dragCtx = this.dragCanvas.getContext('2d');
            }

            this.resize();
            this.initGrid();

            UI.init();
            Effects.init(this.ctx);
            SoundManager.init(); // Uygulama durumunu dinlemek için erken başlatıyoruz

            window.addEventListener('resize', () => this.resize());
            this.setupInput();

            // Mobile layout settling
            setTimeout(() => this.resize(), 100);

            requestAnimationFrame((t) => this.loop(t));
            console.log("Game: Initialization Success");
        } catch (e) {
            console.error("Game: Initialization Failed", e);
        }
    },

    resize: function () {
        const container = document.getElementById('game-container');
        if (!container) return;
        const size = container.clientWidth || 300; // Fallback
        this.canvas.width = size;
        this.canvas.height = size;
        this.cellSize = size / this.gridSize;

        if (this.dragCanvas) {
            this.dragCanvas.width = window.innerWidth;
            this.dragCanvas.height = window.innerHeight;
        }
    },

    initGrid: function () {
        this.grid = [];
        for (let r = 0; r < this.gridSize; r++) {
            this.grid[r] = Array(this.gridSize).fill(null);
        }
    },

    start: function () {
        this.state = GameState.PLAYING;
        this.score = 0;
        this.startTime = Date.now();
        this.initGrid();
        this.spawnRound();
        UI.updateScore(0);
        showBannerAd();
        SoundManager.playMusic();
    },

    spawnRound: function () {
        for (let i = 0; i < 3; i++) {
            this.inventory[i] = this.getWeightedRandomBlock();
        }
        UI.renderInventory(this.inventory);
    },

    getWeightedRandomBlock: function () {
        // Adaptive Weights
        let weights = { ...SPAWN_WEIGHTS };

        // Rescue Mode: If moves are low, increase SINGLE block odds
        if (this.isStuckish()) {
            weights.SINGLE += 20;
        }

        // Reward Mode: If last move was a big combo, increase MEGA block odds
        if (this.lastCombo >= 2) {
            weights.MEGA_3X3 += 10;
        }

        const keys = Object.keys(weights);
        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;

        let selectedCategory = 'TETROMINO';
        for (const key of keys) {
            if (random < weights[key]) {
                selectedCategory = key;
                break;
            }
            random -= weights[key];
        }

        let type;
        if (selectedCategory === 'TETROMINO') {
            const tetros = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];
            type = tetros[Math.floor(Math.random() * tetros.length)];
        } else {
            type = selectedCategory;
        }

        const proto = BLOCK_POOL[type];
        return {
            type: type,
            shape: JSON.parse(JSON.stringify(proto.shape)),
            color: proto.color,
            rotatable: proto.rotatable,
            placed: false
        };
    },

    isStuckish: function () {
        // If more than 70% of the grid is full, we are "stuckish"
        let fullCells = 0;
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (this.grid[r][c]) fullCells++;
            }
        }
        return fullCells > (this.gridSize * this.gridSize * 0.7);
    },

    rotatePiece: function (index) {
        if (index === -1 || !this.inventory[index] || this.inventory[index].placed) return;

        const piece = this.inventory[index];
        if (piece.rotatable === false) return;
        const rows = piece.shape.length;
        const cols = piece.shape[0].length;
        const newShape = Array(cols).fill(0).map(() => Array(rows).fill(0));

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                newShape[c][rows - 1 - r] = piece.shape[r][c];
            }
        }
        piece.shape = newShape;
        UI.renderInventory(this.inventory);
        SoundManager.playClick();
    },

    setupInput: function () {
        const handleDown = (e, isTouch) => {
            if (this.state !== GameState.PLAYING) return;

            // Unblock UI buttons from global preventDefault
            if (isTouch && e.target.closest('button')) return;
            if (isTouch) e.preventDefault();

            const clientX = isTouch ? e.touches[0].clientX : e.clientX;
            const clientY = isTouch ? e.touches[0].clientY : e.clientY;

            const slotIndex = UI.getSlotIndexAt(clientX, clientY);

            if (slotIndex !== -1) {
                const piece = this.inventory[slotIndex];
                if (piece && !piece.placed) {
                    this.selectedIndex = slotIndex;
                    UI.selectSlot(slotIndex);
                    this.isDragging = true;
                    this.hasMoved = false;
                    this.dragStartPos = { x: clientX, y: clientY };

                    const pos = this.getMousePosFromCoords(clientX, clientY - this.dragOffsetY);
                    this.dragX = clientX; // Store screen-space X for overlay
                    this.dragY = clientY - this.dragOffsetY; // Store screen-space Y (offset) for overlay
                    if (this.dragCanvas) this.dragCanvas.style.display = 'block';
                }
            }
        };

        const handleMove = (e, isTouch) => {
            if (this.isDragging) {
                if (isTouch) e.preventDefault();
                const clientX = isTouch ? e.touches[0].clientX : e.clientX;
                const clientY = isTouch ? e.touches[0].clientY : e.clientY;

                const dist = Math.hypot(clientX - this.dragStartPos.x, clientY - this.dragStartPos.y);
                if (dist > 10) this.hasMoved = true;

                const pos = this.getMousePosFromCoords(clientX, clientY - this.dragOffsetY);
                this.dragX = clientX; // Store screen-space X for overlay
                this.dragY = clientY - this.dragOffsetY; // Store screen-space Y (offset) for overlay
            }
        };

        const handleUp = (e, isTouch) => {
            if (this.isDragging) {
                const clientX = isTouch ? e.changedTouches[0].clientX : e.clientX;
                const clientY = isTouch ? e.changedTouches[0].clientY : e.clientY;
                const pos = this.getMousePosFromCoords(clientX, clientY - this.dragOffsetY);

                if (!this.hasMoved) {
                    // It was a tap -> Rotate
                    this.rotatePiece(this.selectedIndex);
                } else {
                    // It was a drag -> Try Place
                    this.tryPlace(pos.x, pos.y);
                }

                this.isDragging = false;
                this.hasMoved = false;
                if (this.dragCanvas) this.dragCanvas.style.display = 'none';
            }
        };

        window.addEventListener('mousedown', (e) => handleDown(e, false));
        window.addEventListener('mousemove', (e) => handleMove(e, false));
        window.addEventListener('mouseup', (e) => handleUp(e, false));

        window.addEventListener('touchstart', (e) => handleDown(e, true), { passive: false });
        window.addEventListener('touchmove', (e) => handleMove(e, true), { passive: false });
        window.addEventListener('touchend', (e) => handleUp(e, true), { passive: false });
    },

    getMousePosFromCoords: function (clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    },

    tryPlace: function (x, y) {
        if (this.selectedIndex === -1) return;
        const piece = this.inventory[this.selectedIndex];
        if (!piece || piece.placed) return;

        // Calculate grid index (centering the piece on mouse)
        const pieceRows = piece.shape.length;
        const pieceCols = piece.shape[0].length;

        const gridCol = Math.round((x / this.cellSize) - (pieceCols / 2));
        const gridRow = Math.round((y / this.cellSize) - (pieceRows / 2));

        if (this.canPlace(gridRow, gridCol, piece.shape)) {
            this.placePiece(gridRow, gridCol, piece);
            piece.placed = true;
            this.selectedIndex = -1;
            UI.selectSlot(-1);
            UI.renderInventory(this.inventory);

            this.checkClears();

            // Check if round is over
            if (this.inventory.every(p => p.placed)) {
                this.spawnRound();
            }

            // Check if game over
            if (this.isGameOver()) {
                this.gameOver();
            }
        }
    },

    canPlace: function (startRow, startCol, shape) {
        const rows = shape.length;
        const cols = shape[0].length;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (shape[r][c] === 1) {
                    const gr = startRow + r;
                    const gc = startCol + c;
                    if (gr < 0 || gr >= this.gridSize || gc < 0 || gc >= this.gridSize) return false;
                    if (this.grid[gr][gc]) return false;
                }
            }
        }
        return true;
    },

    placePiece: function (startRow, startCol, piece) {
        const shape = piece.shape;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[0].length; c++) {
                if (shape[r][c] === 1) {
                    this.grid[startRow + r][startCol + c] = { color: piece.color, scale: 1 };
                }
            }
        }
        SoundManager.playClick();
        if (StorageManager.getSettings().vibration && navigator.vibrate) {
            navigator.vibrate(30);
        }
    },

    checkClears: function () {
        let rowsToClear = [];
        let colsToClear = [];

        // Check rows
        for (let r = 0; r < this.gridSize; r++) {
            if (this.grid[r].every(cell => cell !== null)) {
                rowsToClear.push(r);
            }
        }

        // Check columns
        for (let c = 0; c < this.gridSize; c++) {
            let full = true;
            for (let r = 0; r < this.gridSize; r++) {
                if (this.grid[r][c] === null) {
                    full = false;
                    break;
                }
            }
            if (full) colsToClear.push(c);
        }

        if (rowsToClear.length > 0 || colsToClear.length > 0) {
            this.performClear(rowsToClear, colsToClear);
        }
    },

    performClear: function (rows, cols) {
        const combo = rows.length + cols.length;
        this.lastCombo = combo;
        let points = 0;

        // Collect all cells and explode them
        rows.forEach(r => {
            for (let c = 0; c < this.gridSize; c++) {
                this.explodeCell(r, c);
                this.grid[r][c] = null;
            }
            points += 100;
        });

        cols.forEach(c => {
            for (let r = 0; r < this.gridSize; r++) {
                if (this.grid[r][c]) { // Might already be cleared by a row
                    this.explodeCell(r, c);
                    this.grid[r][c] = null;
                }
                points += 100;
            }
        });

        this.score += points * combo;
        UI.updateScore(this.score);
        SoundManager.playMatch();

        if (combo > 1) {
            Effects.shake(document.getElementById('game-container'));
        }
        if (StorageManager.getSettings().vibration && navigator.vibrate) {
            navigator.vibrate(100);
        }
    },

    explodeCell: function (r, c) {
        const cell = this.grid[r][c];
        if (cell) {
            Effects.createExplosion(
                c * this.cellSize + this.cellSize / 2,
                r * this.cellSize + this.cellSize / 2,
                cell.color
            );
        }
    },

    isGameOver: function () {
        // Can ANY remaining piece be placed ANYWHERE?
        return this.inventory.every(p => {
            if (p.placed) return true; // Already placed, ignore

            // Search all grid positions for THIS piece
            for (let r = -2; r < this.gridSize; r++) {
                for (let c = -2; c < this.gridSize; c++) {
                    if (this.canPlace(r, c, p.shape)) return false;
                }
            }
            return true;
        });
    },

    gameOver: function () {
        this.state = GameState.GAME_OVER;

        // Trigger Firework Explosions for all blocks
        let delay = 0;
        const cellsWithBlocks = [];

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (this.grid[r][c]) {
                    cellsWithBlocks.push({ r, c, color: this.grid[r][c].color });
                }
            }
        }

        // Shuffle for random explosion order
        cellsWithBlocks.sort(() => Math.random() - 0.5);

        cellsWithBlocks.forEach((cell, index) => {
            setTimeout(() => {
                Effects.createFirework(
                    cell.c * this.cellSize + this.cellSize / 2,
                    cell.r * this.cellSize + this.cellSize / 2,
                    cell.color
                );
                this.grid[cell.r][cell.c] = null; // Clear from grid visually
                SoundManager.playClick();

                if (index % 5 === 0 && navigator.vibrate) navigator.vibrate(20);
            }, index * 30); // Faster stagger
        });

        // Wait for all explosions to finish before showing UI
        setTimeout(() => {
            UI.showGameOver(this.score);
        }, Math.max(1500, cellsWithBlocks.length * 30 + 500));
    },

    resumeAfterAd: function () {
        this.initGrid(); // Fresh start for continuing
        this.spawnRound();
        this.state = GameState.PLAYING;
        this.startTime = Date.now(); // Reset timer too
    },

    update: function (dt) {
        if (this.state === GameState.PLAYING) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const mins = Math.floor(elapsed / 60);
            const secs = elapsed % 60;
            UI.updateTimer(mins, secs);
        }
    },

    loop: function (now) {
        const dt = now - this.lastTime;
        this.lastTime = now;
        this.update(dt);
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    },

    draw: function () {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Grid Lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i <= this.gridSize; i++) {
            const pos = i * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(pos, 0); this.ctx.lineTo(pos, this.canvas.height);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(0, pos); this.ctx.lineTo(this.canvas.width, pos);
            this.ctx.stroke();
        }

        // Draw Placed Blocks
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const block = this.grid[r][c];
                if (block) this.drawBlock(r, c, block.color);
            }
        }

        // Draw Dragging Preview & Ghost on Grid
        if (this.isDragging && this.selectedIndex !== -1) {
            const piece = this.inventory[this.selectedIndex];

            // Clear Overlay
            if (this.dragCtx) {
                this.dragCtx.clearRect(0, 0, this.dragCanvas.width, this.dragCanvas.height);
            }

            // Calculate grid position for ghost (using screen coords converted to canvas coords)
            const canvasPos = this.getMousePosFromCoords(this.dragX, this.dragY);
            const pieceRows = piece.shape.length;
            const pieceCols = piece.shape[0].length;
            const gridCol = Math.round((canvasPos.x / this.cellSize) - (pieceCols / 2));
            const gridRow = Math.round((canvasPos.y / this.cellSize) - (pieceRows / 2));

            // Grid highlighting ghost (on main canvas)
            if (this.canPlace(gridRow, gridCol, piece.shape)) {
                this.drawGridPreview(gridRow, gridCol, piece);
            }

            // Floating piece (on overlay canvas)
            if (this.dragCtx) {
                this.drawFloatingPiece(this.dragX, this.dragY, piece, this.dragCtx);
            }
        }

        Effects.updateAndDraw(0);
    },

    drawGridPreview: function (startRow, startCol, piece) {
        for (let r = 0; r < piece.shape.length; r++) {
            for (let c = 0; c < piece.shape[0].length; c++) {
                if (piece.shape[r][c] === 1) {
                    this.drawBlock(startRow + r, startCol + c, piece.color, 0.3);
                }
            }
        }
    },

    drawFloatingPiece: function (x, y, piece, targetCtx) {
        const ctx = targetCtx || this.ctx;
        const rows = piece.shape.length;
        const cols = piece.shape[0].length;
        const startX = x - (cols * this.cellSize) / 2;
        const startY = y - (rows * this.cellSize) / 2;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (piece.shape[r][c] === 1) {
                    const px = startX + c * this.cellSize + 2;
                    const py = startY + r * this.cellSize + 2;
                    const size = this.cellSize - 4;

                    ctx.fillStyle = piece.color;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = piece.color;
                    ctx.beginPath();
                    ctx.roundRect(px, py, size, size, 8);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }
        }
    },

    drawBlock: function (r, c, color, alpha = 1.0) {
        const padding = 2;
        const x = c * this.cellSize + padding;
        const y = r * this.cellSize + padding;
        const size = this.cellSize - padding * 2;

        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = color;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = color;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, size, size, 8);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1.0;
    },


};

const startApp = async () => {
    console.log("App: startApp triggered - State:", document.readyState);
    try {

        // Initialize Game
        Game.init();
        console.log("App: Game.init complete");

    } catch (e) {
        console.error("App: Startup failed", e);
        alert("Startup Critical Error: " + e.message);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

window.Game = Game;
