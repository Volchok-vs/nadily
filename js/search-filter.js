// js/search-filter.js

let searchTimeout;

export function initSearchAndFilters(map, allParcelLayers) {
    const searchInput = document.getElementById('searchNumber');
    const radioFilters = document.querySelectorAll('input[name="statusFilter"]');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value.trim().toLowerCase();

            // --- ТВОЯ ЛОГІКА: Скидаємо радіо-кнопки на "Всі" при пошуку ---
            if (val !== "") {
                const allRadio = document.querySelector('input[name="statusFilter"][value="all"]');
                if (allRadio) allRadio.checked = true;
            }

            // Миттєва фільтрація
            allParcelLayers.forEach(item => {
                const isMatch = item.name.includes(val);
                if (isMatch) map.addLayer(item.layer);
                else map.removeLayer(item.layer);
            });

            // Плавний політ
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (val !== "") {
                    const target = allParcelLayers.find(p => p.name === val);
                    if (target) {
                        map.flyToBounds(target.layer.getBounds(), {
                            padding: [120, 120],
                            duration: 2.0,
                            easeLinearity: 0.1,
                            maxZoom: 18
                        });
                        setTimeout(() => target.layer.fire('click'), 2100);
                    }
                }
            }, 800);
        });
    }

    radioFilters.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const status = e.target.value;
            const currentUserId = localStorage.getItem('userId');

            if (searchInput) searchInput.value = "";

            allParcelLayers.forEach(item => {
                const p = item.data; // Отримуємо дані дільниці
                
                // ЗАХИСТ: якщо даних немає (наприклад, це просто текстова мітка), 
                // ми просто пропускаємо цей елемент, щоб не було помилки
                if (!p) return;

                let show = false;

                switch (status) {
                    case 'all': 
                        show = true; 
                        break;
                    case 'free': 
                        show = (p.status !== 'taken'); 
                        break;
                    case 'taken': 
                        show = (p.status === 'taken'); 
                        break;
                    case 'mine': 
                        show = (String(p.taken_by_id) === String(currentUserId)); 
                        break;
                }

                if (show) {
                    map.addLayer(item.layer);
                } else {
                    map.removeLayer(item.layer);
                }
            });
        });
    });

    // СКИНУТИ ПОШУК КЛІКОМ ПО КАРТІ
    map.on('click', (e) => {
        // Перевіряємо, чи клікнули по самому контейнеру карти
        const isMapClick = e.originalEvent.target.id === 'map' || 
                           e.originalEvent.target.classList.contains('leaflet-container');

        if (isMapClick && searchInput.value !== "") {
            searchInput.value = ""; // Очищаємо інпут

            const activeFilter = document.querySelector('input[name="statusFilter"]:checked').value;
            const currentUserId = localStorage.getItem('userId');

            allParcelLayers.forEach(item => {
                const p = item.data;
                if (!p) return;

                let show = false;
                if (activeFilter === 'all') show = true;
                else if (activeFilter === 'free') show = p.status !== 'taken';
                else if (activeFilter === 'taken') show = p.status === 'taken';
                else if (activeFilter === 'mine') show = String(p.taken_by_id) === String(currentUserId);

                if (show) {
                    // 1. Повертаємо саму дільницю (заливку)
                    if (!map.hasLayer(item.layer)) {
                        map.addLayer(item.layer);
                    }
                    
                    // 2. ПОВЕРТАЄМО НОМЕР (label), якщо він існує
                    if (item.label && !map.hasLayer(item.label)) {
                        map.addLayer(item.label);
                    }
                } else {
                    // Ховаємо і дільницю, і номер
                    map.removeLayer(item.layer);
                    if (item.label) {
                        map.removeLayer(item.label);
                    }
                }
            });
            
            console.log("Пошук скинуто, фільтри оновлено");
        }
    });
}