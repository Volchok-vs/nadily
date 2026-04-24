(async function () {
    // 1. ПІДГОТОВКА
    const { data: allParcels } = await supabase.from('parcels').select('*');
    const { data: { session } } = await supabase.auth.getSession();
    const myEmail = session?.user?.email || "";

    // Більш надійний фільтр для "Моїх"
    const myParcels = allParcels.filter(p => p.taken_by === myEmail);
    const myParcelsCount = myParcels.length;

    // Лог для перевірки в консолі (можна видалити потім)
    console.log("Ваш email:", myEmail, "| Знайдено дільниць:", myParcelsCount);

    // Визначаємо унікальні категорії серед ваших дільниць
    const myUniqueCats = [...new Set(myParcels.map(p => (p.category || "").toLowerCase()).filter(c => c))];
    // ...

    window.renderParcels = function (filteredData) {
        const filteredIds = filteredData.map(p => p.id);
        if (!window.allParcelLayers) return console.error("Помилка: Карта не завантажена.");

        window.allParcelLayers.forEach(item => {
            const shouldShow = filteredIds.includes(item.id);
            if (shouldShow) {
                if (!window.map.hasLayer(item.layer)) item.layer.addTo(window.map);
                if (!window.map.hasLayer(item.label)) item.label.addTo(window.map);
            } else {
                window.map.removeLayer(item.layer);
                if (item.label) window.map.removeLayer(item.label);
            }
        });
    };

    // 2. СТИЛІ
    if (document.getElementById('final-logic-styles')) document.getElementById('final-logic-styles').remove();
    const styleSheet = document.createElement("style");
    styleSheet.id = 'final-logic-styles';
    styleSheet.innerText = `
        #filterMenu { position: fixed; top: 10px; left: 10px; background: white; padding: 18px; border-radius: 15px; z-index: 10001; box-shadow: 0 10px 40px rgba(0,0,0,0.2); width: 300px; font-family: sans-serif; }
        .filter-section { margin-bottom: 8px; padding: 10px; border-radius: 10px; border: 1px solid #eee; transition: 0.2s; cursor: pointer; }
        .filter-section.active { border-color: #1565C0; background: #f8fbff; opacity: 1; }
        .filter-section.inactive { opacity: 0.5; background: #fafafa; }
        .sub-list { padding-left: 28px; margin-top: 10px; display: none; flex-direction: column; gap: 8px; }
        .filter-section.active .sub-list { display: flex; }
        .row { display: flex; align-items: center; width: 100%; cursor: pointer; font-size: 14px; }
        .count-badge { font-size: 11px; background: #eee; padding: 2px 8px; border-radius: 10px; margin-left: auto; font-weight: bold; color: #666; }
        .filter-section.active .count-badge { background: #1565C0; color: white; }
        .hidden-cat { display: none !important; }
        #searchBox { width: 100%; padding: 10px; margin-bottom: 15px; border: 2px solid #eef2f7; border-radius: 10px; box-sizing: border-box; outline: none; }
    `;
    document.head.appendChild(styleSheet);

    if (document.getElementById('filterMenu')) document.getElementById('filterMenu').remove();

    // 3. HTML
    const menu = document.createElement('div');
    menu.id = 'filterMenu';
    const cats = [
        { id: 'приватн', label: '🏠 Приватні' },
        { id: 'змішан', label: '🏢+🏠 Змішані' },
        { id: 'поверхів', label: '🏢 Поверхівки' },
        { id: 'ділова', label: '💼 Ділова тер.', admin: true },
        { id: 'села', label: '🚜 Села', admin: true }
    ];

    menu.innerHTML = `
        <h4 style="margin:0 0 12px 0;">🔍 Розумний фільтр</h4>
        <input type="text" id="searchBox" placeholder="Введіть точний номер...">

        <div class="filter-section active" id="sec-all">
            <label class="row"><input type="checkbox" id="chk-all" checked> <span style="margin-left:10px;">Показати все</span> <span class="count-badge">${allParcels.length}</span></label>
        </div>

        <div class="filter-section inactive" id="sec-free">
            <label class="row"><input type="checkbox" id="chk-free"> <span style="margin-left:10px;">✅ Вільні</span> <span class="count-badge" id="cnt-free">0</span></label>
            <div class="sub-list">
                ${cats.map(c => `<label class="row sub-item ${c.admin ? 'hidden-cat' : ''}" data-cat="${c.id}"><input type="checkbox" class="sub-free" data-type="${c.id}"> <span style="margin-left:8px;">${c.label}</span></label>`).join('')}
            </div>
        </div>

        <div class="filter-section inactive" id="sec-taken">
            <label class="row"><input type="checkbox" id="chk-taken"> <span style="margin-left:10px;">🚩 На руках</span> <span class="count-badge" id="cnt-taken">0</span></label>
            <div class="sub-list">
                ${cats.map(c => `<label class="row sub-item ${c.admin ? 'hidden-cat' : ''}" data-cat="${c.id}"><input type="checkbox" class="sub-taken" data-type="${c.id}"> <span style="margin-left:8px;">${c.label}</span></label>`).join('')}
            </div>
        </div>

        // У блоці menu.innerHTML знайдіть частину sec-mine:

        <div class="filter-section inactive" id="sec-mine" style="display: ${myParcelsCount > 0 ? 'block' : 'none'};">
            <label class="row">
                <input type="checkbox" id="chk-mine"> 
                <span style="margin-left:10px;">👤 Мої дільниці</span> 
                <span class="count-badge">${myParcelsCount}</span>
            </label>
            <div class="sub-list">
                ${cats.filter(c => myUniqueCats.some(uc => uc.includes(c.id))).map(c => `
                    <label class="row sub-item" data-cat="${c.id}">
                        <input type="checkbox" class="sub-mine" data-type="${c.id}"> 
                        <span style="margin-left:8px;">${c.label}</span>
                    </label>
                `).join('')}
            </div>
        </div>

        <div style="margin-top:10px; border-top:1px dashed #ccc; padding-top:10px; font-size:11px; color:#888;">
            <details>
                <summary style="cursor:pointer;">Налаштування категорій</summary>
                <label style="display:block; margin-top:5px;"><input type="checkbox" onchange="window.tCat('ділова', this.checked)"> Ділова</label>
                <label style="display:block;"><input type="checkbox" onchange="window.tCat('села', this.checked)"> Села</label>
            </details>
        </div>
    `;
    document.body.appendChild(menu);

    // 4. ЛОГІКА
    let searchTimeout;

    const apply = () => {
        const searchVal = document.getElementById('searchBox').value.trim().toLowerCase();
        const isAll = document.getElementById('chk-all').checked;
        const isFree = document.getElementById('chk-free').checked;
        const isTaken = document.getElementById('chk-taken').checked;
        const isMine = document.getElementById('chk-mine').checked;

        document.getElementById('sec-all').className = `filter-section ${isAll ? 'active' : 'inactive'}`;
        document.getElementById('sec-free').className = `filter-section ${isFree ? 'active' : 'inactive'}`;
        document.getElementById('sec-taken').className = `filter-section ${isTaken ? 'active' : 'inactive'}`;
        const mS = document.getElementById('sec-mine'); if (mS) mS.className = `filter-section ${isMine ? 'active' : 'inactive'}`;

        const filtered = allParcels.filter(p => {
            const parcelName = (p.name || "").toString().toLowerCase();
            const pStatus = (p.status || "").toLowerCase();
            const pCat = (p.category || "").toLowerCase();
            const isActuallyFree = (!pStatus || pStatus === 'free' || pStatus === 'null' || pStatus === '');

            if (searchVal !== "" && parcelName !== searchVal) return false;

            if (isAll) return true;

            // Фільтрація МОЇХ
            if (isMine && p.taken_by === myEmail) {
                const activeCats = Array.from(document.querySelectorAll('.sub-mine:checked')).map(el => el.dataset.type);
                if (activeCats.length === 0) return true; // Якщо підкатегорії не обрані, показуємо всі мої
                return activeCats.some(c => pCat.includes(c));
            }

            if (isFree && isActuallyFree) {
                const activeCats = Array.from(document.querySelectorAll('.sub-free:checked')).map(el => el.dataset.type);
                return activeCats.some(c => pCat.includes(c));
            }

            if (isTaken && (pStatus === 'taken' || pStatus === 'reserved')) {
                const activeCats = Array.from(document.querySelectorAll('.sub-taken:checked')).map(el => el.dataset.type);
                return activeCats.some(c => pCat.includes(c));
            }
            return false;
        });

        window.renderParcels(filtered);
    };

    const switchMode = (id) => {
        document.getElementById('searchBox').value = "";
        ['chk-all', 'chk-free', 'chk-taken', 'chk-mine'].forEach(cid => {
            const el = document.getElementById(cid); if (!el) return;
            if (cid === id) {
                el.checked = true;
                if (id === 'chk-free') document.querySelectorAll('.sub-free').forEach(s => s.checked = true);
                if (id === 'chk-taken') document.querySelectorAll('.sub-taken').forEach(s => s.checked = true);
                if (id === 'chk-mine') document.querySelectorAll('.sub-mine').forEach(s => s.checked = true);
            } else {
                el.checked = false;
                if (cid === 'chk-free') document.querySelectorAll('.sub-free').forEach(s => s.checked = false);
                if (cid === 'chk-taken') document.querySelectorAll('.sub-taken').forEach(s => s.checked = false);
                if (cid === 'chk-mine') document.querySelectorAll('.sub-mine').forEach(s => s.checked = false);
            }
        });
        apply();
    };

    // 5. ПОДІЇ
    window.tCat = (id, show) => document.querySelectorAll(`.sub-item[data-cat="${id}"]`).forEach(e => e.classList.toggle('hidden-cat', !show));

    document.getElementById('chk-all').onchange = () => switchMode('chk-all');
    document.getElementById('chk-free').onchange = () => switchMode('chk-free');
    document.getElementById('chk-taken').onchange = () => switchMode('chk-taken');
    if (document.getElementById('chk-mine')) document.getElementById('chk-mine').onchange = () => switchMode('chk-mine');

    document.getElementById('searchBox').onfocus = () => {
        if (!document.getElementById('chk-all').checked) {
            ['chk-all', 'chk-free', 'chk-taken', 'chk-mine'].forEach(cid => {
                const el = document.getElementById(cid); if (el) el.checked = (cid === 'chk-all');
            });
            apply();
        }
    };

    document.getElementById('searchBox').oninput = () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(apply, 400);
    };

    document.querySelectorAll('.sub-free, .sub-taken, .sub-mine').forEach(el => el.onchange = apply);

    // Лічильники
    document.getElementById('cnt-free').innerText = allParcels.filter(p => !p.status || p.status === 'free' || p.status === 'null' || p.status === '').length;
    document.getElementById('cnt-taken').innerText = allParcels.filter(p => p.status === 'taken' || p.status === 'reserved').length;

    apply();
})();