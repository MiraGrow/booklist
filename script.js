// 데이터 상태 관리 (로컬 스토리지 사용)
let books = JSON.parse(localStorage.getItem('reading_journal') || '[]');
let currentRating = 3;

// 초기 아이콘 생성
lucide.createIcons();

// 별점 시스템 초기화
const starContainer = document.getElementById('star-rating');
function initStars() {
    starContainer.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const s = document.createElement('span');
        s.className = 'star-btn';
        s.dataset.val = i;
        s.textContent = i <= currentRating ? '★' : '☆';
        s.style.color = i <= currentRating ? '#c8860a' : '#c4a97088';
        s.addEventListener('click', () => { 
            currentRating = i; 
            renderStars(); 
        });
        starContainer.appendChild(s);
    }
}

function renderStars() {
    [...starContainer.children].forEach((s, idx) => {
        const on = idx < currentRating;
        s.textContent = on ? '★' : '☆';
        s.style.color = on ? '#c8860a' : '#c4a97088';
    });
}

// 데이터 저장
function save() { 
    localStorage.setItem('reading_journal', JSON.stringify(books)); 
}

// 폼 제출 이벤트
document.getElementById('book-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const book = {
        id: Date.now().toString(),
        title: document.getElementById('inp-title').value.trim(),
        author: document.getElementById('inp-author').value.trim(),
        genre: document.getElementById('inp-genre').value,
        rating: currentRating,
        memo: document.getElementById('inp-memo').value.trim(),
        date: new Date().toISOString()
    };
    
    books.unshift(book);
    save();
    
    // 초기화
    e.target.reset();
    currentRating = 3;
    renderStars();
    renderList();
});

// 리스트 렌더링
function renderList() {
    const list = document.getElementById('book-list');
    const empty = document.getElementById('empty-msg');
    document.getElementById('book-count').textContent = books.length + '권';

    if (!books.length) { 
        list.innerHTML = ''; 
        empty.style.display = 'block'; 
        return; 
    }
    empty.style.display = 'none';
    list.innerHTML = '';

    books.forEach((book, idx) => {
        const card = document.createElement('div');
        card.className = 'book-card rounded-xl p-4 fade-in';
        card.dataset.id = book.id;
        card.style.animationDelay = (idx * 0.05) + 's';
        
        const stars = '★'.repeat(book.rating) + '☆'.repeat(5 - book.rating);
        const d = new Date(book.date);
        const dateStr = `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;

        card.innerHTML = `
            <div class="flex justify-between items-start gap-2 relative z-10">
                <div class="min-w-0 flex-1">
                    <h3 class="font-bold text-base truncate" style="color:#3e2a14; font-family:'Noto Serif KR',serif">${escapeHtml(book.title)}</h3>
                    <p class="text-xs mt-0.5" style="color:#8b6d4a">${escapeHtml(book.author)} · ${escapeHtml(book.genre)} · ${dateStr}</p>
                    <p class="text-sm mt-0.5" style="color:#c8860a; letter-spacing:2px">${stars}</p>
                </div>
                <button class="del-btn p-1.5 rounded-lg transition-colors" style="color:#a08060;">
                    <i data-lucide="trash-2" style="width:16px;height:16px"></i>
                </button>
            </div>
            <div class="confirm-area relative z-10"></div>
            <p class="text-sm mt-3 leading-relaxed relative z-10" style="color:#5a3a1a; border-top:1px dashed rgba(139,90,43,.15); padding-top:10px">
                "${escapeHtml(book.memo)}"
            </p>
            <div class="paper-texture"></div>
        `;

        // 삭제 로직
        card.querySelector('.del-btn').addEventListener('click', () => {
            const area = card.querySelector('.confirm-area');
            if (area.children.length) { area.innerHTML = ''; return; }
            
            area.innerHTML = `
                <div class="delete-confirm flex items-center gap-2 mt-2 text-xs" style="color:#b45040">
                    <span>삭제할까요?</span>
                    <button class="cfm-yes px-3 py-1 rounded font-bold" style="background:#b45040;color:#fff">삭제</button>
                    <button class="cfm-no px-3 py-1 rounded" style="background:rgba(139,90,43,.1);color:#6b4226">취소</button>
                </div>`;
                
            area.querySelector('.cfm-yes').addEventListener('click', () => {
                books = books.filter(b => b.id !== book.id);
                save();
                card.style.opacity = '0';
                card.style.transform = 'translateY(-10px)';
                setTimeout(() => renderList(), 300);
            });
            area.querySelector('.cfm-no').addEventListener('click', () => { area.innerHTML = ''; });
        });

        list.appendChild(card);
        lucide.createIcons({ nodes: [card] });
    });
}

// XSS 방지용 이스케이프 함수
function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

// 초기화 실행
initStars();
renderList();
