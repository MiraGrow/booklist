<script>
        // ==========================================
        // 게임 상태 관리
        // ==========================================

        const BOARD_SIZE = 6;
        const CELL_SIZE = 70;
        const EXIT_POS = 5; // 출구는 6번째 열(인덱스 5)

        let gameState = {
            moveCount: 0,
            currentDifficulty: 'easy',
            vehicles: [],
            selectedVehicle: null,
            isCleared: false
        };

        // ==========================================
        // 차량 데이터 정의
        // ==========================================

        const PUZZLE_SETS = {
            easy: [
                [
                    { id: 'A', x: 1, y: 2, length: 2, direction: 'horizontal', color: 'red' },
                    { id: 'B', x: 0, y: 0, length: 3, direction: 'vertical', color: 'blue' },
                    { id: 'C', x: 3, y: 1, length: 2, direction: 'horizontal', color: 'green' },
                    { id: 'D', x: 5, y: 3, length: 2, direction: 'vertical', color: 'yellow' }
                ]
            ],
            normal: [
                [
                    { id: 'A', x: 1, y: 2, length: 2, direction: 'horizontal', color: 'red' },
                    { id: 'B', x: 0, y: 0, length: 3, direction: 'vertical', color: 'blue' },
                    { id: 'C', x: 3, y: 1, length: 2, direction: 'horizontal', color: 'green' },
                    { id: 'D', x: 5, y: 3, length: 2, direction: 'vertical', color: 'yellow' },
                    { id: 'E', x: 2, y: 4, length: 2, direction: 'vertical', color: 'orange' }
                ]
            ],
            hard: [
                [
                    { id: 'A', x: 1, y: 2, length: 2, direction: 'horizontal', color: 'red' },
                    { id: 'B', x: 0, y: 0, length: 3, direction: 'vertical', color: 'blue' },
                    { id: 'C', x: 3, y: 1, length: 3, direction: 'horizontal', color: 'green' },
                    { id: 'D', x: 0, y: 4, length: 2, direction: 'horizontal', color: 'yellow' },
                    { id: 'E', x: 2, y: 4, length: 2, direction: 'vertical', color: 'orange' },
                    { id: 'F', x: 4, y: 5, length: 2, direction: 'horizontal', color: 'purple' }
                ]
            ]
        };

        // ==========================================
        // 충돌 체크 함수
        // ==========================================

        /**
         * 주어진 위치에 다른 차량이 있는지 확인
         * @param {number} x - x 좌표
         * @param {number} y - y 좌표
         * @param {string} excludeId - 제외할 차량 ID
         * @returns {boolean} 충돌 여부
         */
        function isPositionOccupied(x, y, excludeId = null) {
            return gameState.vehicles.some(vehicle => {
                if (vehicle.id === excludeId) return false;
                
                for (let i = 0; i < vehicle.length; i++) {
                    if (vehicle.direction === 'horizontal') {
                        if (vehicle.y === y && vehicle.x + i === x) return true;
                    } else {
                        if (vehicle.x === x && vehicle.y + i === y) return true;
                    }
                }
                return false;
            });
        }

        /**
         * 차량이 이동할 수 있는 범위 계산
         * @param {object} vehicle - 차량 객체
         * @returns {object} { minPos, maxPos }
         */
        function getMovableRange(vehicle) {
            let minPos, maxPos;

            if (vehicle.direction === 'horizontal') {
                // 왼쪽 경계
                minPos = 0;
                for (let x = vehicle.x - 1; x >= 0; x--) {
                    if (isPositionOccupied(x, vehicle.y, vehicle.id)) {
                        minPos = x + 1;
                        break;
                    }
                }

                // 오른쪽 경계
                maxPos = BOARD_SIZE - vehicle.length;
                for (let x = vehicle.x + vehicle.length; x < BOARD_SIZE; x++) {
                    if (isPositionOccupied(x, vehicle.y, vehicle.id)) {
                        maxPos = x - vehicle.length;
                        break;
                    }
                }

                return { minPos, maxPos, axis: 'x' };
            } else {
                // 위쪽 경계
                minPos = 0;
                for (let y = vehicle.y - 1; y >= 0; y--) {
                    if (isPositionOccupied(vehicle.x, y, vehicle.id)) {
                        minPos = y + 1;
                        break;
                    }
                }

                // 아래쪽 경계
                maxPos = BOARD_SIZE - vehicle.length;
                for (let y = vehicle.y + vehicle.length; y < BOARD_SIZE; y++) {
                    if (isPositionOccupied(vehicle.x, y, vehicle.id)) {
                        maxPos = y - vehicle.length;
                        break;
                    }
                }

                return { minPos, maxPos, axis: 'y' };
            }
        }

        /**
         * 차량이 이동 가능한지 확인
         * @param {object} vehicle - 차량 객체
         * @param {number} newX - 새 x 좌표
         * @param {number} newY - 새 y 좌표
         * @returns {boolean} 이동 가능 여부
         */
        function canMoveVehicle(vehicle, newX, newY) {
            const range = getMovableRange(vehicle);

            if (vehicle.direction === 'horizontal') {
                return newY === vehicle.y && newX >= range.minPos && newX <= range.maxPos;
            } else {
                return newX === vehicle.x && newY >= range.minPos && newY <= range.maxPos;
            }
        }

        /**
         * 빨간 차가 탈출했는지 확인
         * @returns {boolean} 탈출 여부
         */
        function isGameCleared() {
            const redVehicle = gameState.vehicles.find(v => v.id === 'A');
            return redVehicle && redVehicle.x + redVehicle.length - 1 === EXIT_POS;
        }

        // ==========================================
        // UI 렌더링 함수
        // ==========================================

        /**
         * 보드 렌더링
         */
        function renderBoard() {
            const boardEl = document.getElementById('board');
            boardEl.innerHTML = '';

            // 셀 생성
            for (let y = 0; y < BOARD_SIZE; y++) {
                for (let x = 0; x < BOARD_SIZE; x++) {
                    const cell = document.createElement('div');
                    cell.className = 'cell';
                    
                    // 출구 표시 (빨간 차량 오른쪽, 중앙)
                    if (x === EXIT_POS && y === 2) {
                        cell.classList.add('exit');
                    }

                    boardEl.appendChild(cell);
                }
            }

            // 차량 렌더링
            gameState.vehicles.forEach(vehicle => {
                const vehicleEl = document.createElement('div');
                vehicleEl.className = `vehicle ${vehicle.color}`;
                if (vehicle.id === gameState.selectedVehicle?.id) {
                    vehicleEl.classList.add('selected');
                }

                vehicleEl.textContent = vehicle.id;
                vehicleEl.dataset.vehicleId = vehicle.id;

                // 크기 계산
                if (vehicle.direction === 'horizontal') {
                    vehicleEl.style.width = `${vehicle.length * CELL_SIZE + (vehicle.length - 1) * 2}px`;
                    vehicleEl.style.height = `${CELL_SIZE}px`;
                } else {
                    vehicleEl.style.width = `${CELL_SIZE}px`;
                    vehicleEl.style.height = `${vehicle.length * CELL_SIZE + (vehicle.length - 1) * 2}px`;
                }

                // 위치 계산
                vehicleEl.style.left = `${vehicle.x * (CELL_SIZE + 2) + 10}px`;
                vehicleEl.style.top = `${vehicle.y * (CELL_SIZE + 2) + 10}px`;

                // 이벤트 리스너
                vehicleEl.addEventListener('mousedown', (e) => handleVehicleMouseDown(e, vehicle));
                vehicleEl.addEventListener('touchstart', (e) => handleVehicleTouchStart(e, vehicle));

                boardEl.appendChild(vehicleEl);
            });
        }

        /**
         * 이동 카운터 업데이트
         */
        function updateMoveCounter() {
            document.getElementById('moveCount').textContent = gameState.moveCount;
        }

        /**
         * 별점 계산
         */
        function calculateStars(moveCount) {
            if (moveCount <= 10) return '⭐⭐⭐';
            if (moveCount <= 15) return '⭐⭐';
            return '⭐';
        }

        /**
         * 클리어 모달 표시
         */
        function showClearModal() {
            document.getElementById('finalMoveCount').textContent = gameState.moveCount;
            document.getElementById('starRating').textContent = calculateStars(gameState.moveCount);
            document.getElementById('clearModal').classList.add('show');
        }

        // ==========================================
        // 인터랙션 핸들러
        // ==========================================

        /**
         * 마우스 다운 이벤트
         */
        function handleVehicleMouseDown(e, vehicle) {
            e.preventDefault();
            
            if (gameState.isCleared) return;

            gameState.selectedVehicle = vehicle;
            renderBoard();

            const startX = e.clientX;
            const startY = e.clientY;

            function handleMouseMove(moveEvent) {
                const deltaX = moveEvent.clientX - startX;
                const deltaY = moveEvent.clientY - startY;

                if (vehicle.direction === 'horizontal' && Math.abs(deltaX) > 10) {
                    const newX = Math.max(0, Math.min(BOARD_SIZE - vehicle.length, 
                        vehicle.x + Math.round(deltaX / (CELL_SIZE + 2))));
                    
                    if (canMoveVehicle(vehicle, newX, vehicle.y)) {
                        vehicle.x = newX;
                        renderBoard();
                    }
                } else if (vehicle.direction === 'vertical' && Math.abs(deltaY) > 10) {
                    const newY = Math.max(0, Math.min(BOARD_SIZE - vehicle.length,
                        vehicle.y + Math.round(deltaY / (CELL_SIZE + 2))));
                    
                    if (canMoveVehicle(vehicle, vehicle.x, newY)) {
                        vehicle.y = newY;
                        renderBoard();
                    }
                }
            }

            function handleMouseUp() {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);

                // 이동했는지 확인
                const moved = vehicle.direction === 'horizontal' 
                    ? vehicle.x !== Math.round((startX - 10) / (CELL_SIZE + 2))
                    : vehicle.y !== Math.round((startY - 10) / (CELL_SIZE + 2));

                if (moved) {
                    gameState.moveCount++;
                    updateMoveCounter();

                    if (isGameCleared()) {
                        gameState.isCleared = true;
                        setTimeout(showClearModal, 300);
                    }
                }

                gameState.selectedVehicle = null;
                renderBoard();
            }

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        /**
         * 터치 스타트 이벤트
         */
        function handleVehicleTouchStart(e, vehicle) {
            e.preventDefault();

            if (gameState.isCleared) return;

            gameState.selectedVehicle = vehicle;
            renderBoard();

            const touch = e.touches[0];
            const startX = touch.clientX;
            const startY = touch.clientY;

            function handleTouchMove(moveEvent) {
                const touch = moveEvent.touches[0];
                const deltaX = touch.clientX - startX;
                const deltaY = touch.clientY - startY;

                if (vehicle.direction === 'horizontal' && Math.abs(deltaX) > 10) {
                    const newX = Math.max(0, Math.min(BOARD_SIZE - vehicle.length,
                        vehicle.x + Math.round(deltaX / (CELL_SIZE + 2))));
                    
                    if (canMoveVehicle(vehicle, newX, vehicle.y)) {
                        vehicle.x = newX;
                        renderBoard();
                    }
                } else if (vehicle.direction === 'vertical' && Math.abs(deltaY) > 10) {
                    const newY = Math.max(0, Math.min(BOARD_SIZE - vehicle.length,
                        vehicle.y + Math.round(deltaY / (CELL_SIZE + 2))));
                    
                    if (canMoveVehicle(vehicle, vehicle.x, newY)) {
                        vehicle.y = newY;
                        renderBoard();
                    }
                }
            }

            function handleTouchEnd() {
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleTouchEnd);

                gameState.moveCount++;
                updateMoveCounter();

                if (isGameCleared()) {
                    gameState.isCleared = true;
                    setTimeout(showClearModal, 300);
                }

                gameState.selectedVehicle = null;
                renderBoard();
            }

            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleTouchEnd);
        }

        /**
         * 난이도 버튼 클릭
         */
        function handleDifficultyChange(e) {
            document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            gameState.currentDifficulty = e.target.dataset.difficulty;
            startNewGame();
        }

        // ==========================================
        // 게임 초기화 및 시작
        // ==========================================

        /**
         * 새 게임 시작
         */
        function startNewGame() {
            gameState.moveCount = 0;
            gameState.isCleared = false;
            gameState.selectedVehicle = null;
            
            // 난이도별 초기 배치
            gameState.vehicles = JSON.parse(JSON.stringify(PUZZLE_SETS[gameState.currentDifficulty][0]));
            
            updateMoveCounter();
            renderBoard();
            document.getElementById('clearModal').classList.remove('show');
        }

        /**
         * 이벤트 리스너 등록
         */
        function initializeEventListeners() {
            // 난이도 선택
            document.querySelectorAll('.difficulty-btn').forEach(btn => {
                btn.addEventListener('click', handleDifficultyChange);
            });

            // 다시 시작 버튼
            document.getElementById('restartBtn').addEventListener('click', startNewGame);

            // 모달 닫기
            document.getElementById('closeModalBtn').addEventListener('click', () => {
                document.getElementById('clearModal').classList.remove('show');
                startNewGame();
            });
        }

        // ==========================================
        // 게임 시작
        // ==========================================

        window.addEventListener('DOMContentLoaded', () => {
            initializeEventListeners();
            startNewGame();
        });
    </script>
