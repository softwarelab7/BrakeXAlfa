/// <reference path="types.ts" />
/// <reference path="utils.ts" />

declare var els: any;
declare var appState: any;
declare function filterData(): void;

// --- Toast Notifications ---
function showToastNotification(title: string, body: string) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div class="toast-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-body">${body}</div>
        </div>
        <button class="toast-close" aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
        <div class="toast-progress"></div>
    `;

    container.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        removeToast(toast);
    });

    toast.addEventListener('click', () => {
        const panel = document.getElementById('notificationsPanel');
        panel?.classList.remove('hidden');
        removeToast(toast);
    });

    setTimeout(() => removeToast(toast), 4000);
}

function removeToast(toast: HTMLElement) {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
}

// --- Search History UI ---
function addToSearchHistory(query: string) {
    if (!query) return;
    let history: string[] = JSON.parse(localStorage.getItem('brakeXSearchHistory') || '[]');
    if (!history.includes(query)) {
        history.unshift(query);
        if (history.length > 5) history.pop();
        localStorage.setItem('brakeXSearchHistory', JSON.stringify(history));
    }
    renderSearchHistory();
}

function deleteFromSearchHistory(queryToDelete: string) {
    let history: string[] = JSON.parse(localStorage.getItem('brakeXSearchHistory') || '[]');
    history = history.filter(q => q !== queryToDelete);
    localStorage.setItem('brakeXSearchHistory', JSON.stringify(history));
    renderSearchHistory();
}

function renderSearchHistory() {
    const history: string[] = JSON.parse(localStorage.getItem('brakeXSearchHistory') || '[]');
    const container = els.searchHistoryContainer;
    if (!container) return;
    container.innerHTML = history.map(q =>
        `<button class="search-history-item" data-query="${q}">
            ${q}
            <span class="delete-history-item" data-query-delete="${q}" role="button" aria-label="Eliminar ${q}">&times;</span>
        </button>`
    ).join('');
}

// --- Custom Dropdowns ---
const scrollToSelected = (list: HTMLElement) => {
    requestAnimationFrame(() => {
        const selected = list.querySelector('.selected') as HTMLElement;
        if (selected) {
            list.scrollTop = selected.offsetTop - (list.clientHeight / 2) + (selected.clientHeight / 2);
        }
    });
};

const setupCustomDropdown = (inputId: string, listId: string, items: string[], onSelect?: (value: string) => void) => {
    const input = document.getElementById(inputId) as HTMLInputElement;
    const list = document.getElementById(listId) as HTMLUListElement;
    const container = input?.closest('.custom-select-container') as HTMLElement;

    if (!input || !list || !container) return;

    const renderList = (filterText: string = '') => {
        const normalizedFilter = normalizeText(filterText);
        const filteredItems = items.filter(item => normalizeText(item).includes(normalizedFilter));

        if (filteredItems.length === 0) {
            list.innerHTML = '<li style="pointer-events: none; opacity: 0.6; font-style: italic; font-size: 0.8em; padding: 8px 12px;">Sin resultados</li>';
            return;
        }

        const currentValNormalized = normalizeText(input.value);
        list.innerHTML = filteredItems.map(item => {
            const isSelected = normalizeText(item) === currentValNormalized;
            return `<li class="${isSelected ? 'selected' : ''}">${item}</li>`;
        }).join('');

        Array.from(list.children).forEach((li) => {
            li.addEventListener('click', () => {
                input.value = (li as HTMLElement).innerText;
                list.classList.remove('show');
                list.classList.add('hidden');
                if (onSelect) {
                    onSelect(input.value);
                } else {
                    input.dispatchEvent(new Event('input'));
                }
                filterData();
            });
        });
    };

    input.addEventListener('input', () => {
        renderList(input.value);
        list.classList.remove('hidden');
        list.classList.add('show');
    });

    input.addEventListener('focus', () => {
        renderList(input.value);
        list.classList.remove('hidden');
        list.classList.add('show');
        scrollToSelected(list);
    });

    document.addEventListener('click', (e) => {
        if (!container.contains(e.target as Node)) {
            list.classList.remove('show');
            list.classList.add('hidden');
        }
    });
};

const updateDropdown = (listId: string, items: string[]) => {
    let inputId = '';
    if (listId === 'listaMarcas') inputId = 'filtroMarca';
    else if (listId === 'listaModelos') inputId = 'filtroModelo';
    else if (listId === 'listaAnios') inputId = 'filtroAnio';
    else if (listId === 'oemList' || listId === 'listaOem') inputId = 'filtroOem';
    else if (listId === 'fmsiList' || listId === 'listaFmsi') inputId = 'filtroFmsi';

    if (inputId) setupCustomDropdown(inputId, listId, items);
};


// --- Global Error UI ---
const showGlobalError = (title: string, message: string) => {
    els.results.innerHTML = `<div class="no-results-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <p>${title}</p>
        <span>${message}</span>
    </div>`;
    els.paginationContainer.innerHTML = '';
    els.countContainer.innerHTML = '0 resultados';
};

// --- Animations ---
function createSparks(button: HTMLElement) {
    const NUM_SPARKS = 10;
    const SPARK_COLORS = ['#00ffff', '#ff00ff', '#00ff7f', '#ffc700', '#ff5722'];
    for (let i = 0; i < NUM_SPARKS; i++) {
        const spark = document.createElement('div');
        spark.classList.add('spark');
        const size = Math.random() * 4 + 3;
        spark.style.width = `${size}px`;
        spark.style.height = `${size}px`;
        spark.style.backgroundColor = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];
        spark.style.left = `calc(50% + ${Math.random() * 20 - 10}px)`;
        spark.style.top = `calc(50% + ${Math.random() * 20 - 10}px)`;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 25 + 20;
        spark.style.setProperty('--spark-x', `${Math.cos(angle) * distance}px`);
        spark.style.setProperty('--spark-y', `${Math.sin(angle) * distance}px`);
        button.appendChild(spark);
        spark.addEventListener('animationend', () => spark.remove(), { once: true });
    }
}

// --- Renderers ---
const showSkeletonLoader = (count = 6) => {
    let skeletonHTML = '';
    for (let i = 0; i < count; i++) {
        skeletonHTML += `<div class="skeleton-card"><div class="skeleton-line long"></div><div class="skeleton-line short"></div><div class="skeleton-box"></div><div class="skeleton-line"></div><div class="skeleton-line"></div></div>`;
    }
    els.results.innerHTML = skeletonHTML;
    els.paginationContainer.innerHTML = '';
};

const renderApplicationsList = (aplicaciones: Application[], defaultPos: string) => {
    const safeAplicaciones = Array.isArray(aplicaciones) ? aplicaciones : [];
    const groupedApps = safeAplicaciones.reduce((acc: Record<string, Application[]>, app: Application) => {
        const marca = app.marca || 'N/A';
        if (!acc[marca]) acc[marca] = [];
        acc[marca].push(app);
        return acc;
    }, {} as Record<string, Application[]>);
    Object.keys(groupedApps).forEach(marca => {
        groupedApps[marca].sort((a: Application, b: Application) => {
            const serieA = a.serie || '';
            const serieB = b.serie || '';
            if (serieA !== serieB) return serieA < serieB ? -1 : 1;
            const anioA = a.año || '';
            const anioB = b.año || '';
            return anioA < anioB ? -1 : anioA > anioB ? 1 : 0;
        });
    });
    let appListHTML = '';
    for (const marca in groupedApps) {
        appListHTML += `<div class="app-brand-header">${marca.toUpperCase()}</div>`;
        groupedApps[marca].forEach(app => {
            const posToDisplay = app.posicion || defaultPos || '';
            let posClass = '';
            const posLower = posToDisplay.toLowerCase();
            if (posLower.includes('delantera') && posLower.includes('trasera')) {
                posClass = 'ambas';
            } else if (posLower.includes('delantera')) {
                posClass = 'delantera';
            } else if (posLower.includes('trasera')) {
                posClass = 'trasera';
            }
            appListHTML += `<div class="app-detail-row">
            <div>${app.serie || ''}</div>
            <div>${app.litros || ''}</div>
            <div>${app.año || ''}</div>
            <div class="app-pos-cell ${posClass}" title="${posToDisplay}">${posToDisplay}</div>
        </div>`;
        });
    }
    return appListHTML;
};

const renderSpecs = (item: Product) => {
    let specsHTML = `<div class="app-brand-header">ESPECIFICACIONES</div><div class="spec-details-grid">`;
    const refsSpecsHTML = (Array.isArray(item.ref) && item.ref.length > 0)
        ? item.ref.flatMap((ref: any) => String(ref).split(' '))
            .map((part: string) => `<span class="ref-badge spec-ref-badge ${getRefBadgeClass(part)}">${part}</span>`)
            .join('')
        : '<span class="ref-badge ref-badge-na spec-ref-badge">N/A</span>';
    specsHTML += `<div class="spec-label"><strong>Referencias</strong></div><div class="spec-value modal-ref-container">${refsSpecsHTML}</div>`;
    specsHTML += `<div class="spec-label"><strong>OEM</strong></div><div class="spec-value">${(Array.isArray(item.oem) && item.oem.length > 0) ? item.oem.join(', ') : 'N/A'}</div>`;
    specsHTML += `<div class="spec-label"><strong>Platina FMSI</strong></div><div class="spec-value">${(Array.isArray(item.fmsi) && item.fmsi.length > 0) ? item.fmsi.join(', ') : 'N/A'}</div>`;
    let medidasHTML = '';
    if (Array.isArray(item.medidas) && item.medidas.length > 0) {
        medidasHTML = item.medidas.map(medida => {
            const partes = String(medida).split(/x/i).map(s => s.trim());
            const ancho = partes[0] || 'N/A';
            const alto = partes[1] || 'N/A';
            return `<div>Ancho: ${ancho} x Alto: ${alto}</div>`;
        }).join('');
    } else {
        const anchoVal = item.anchoNum || 'N/A';
        const altoVal = item.altoNum || 'N/A';
        medidasHTML = `<div>Ancho: ${anchoVal} x Alto: ${altoVal}</div>`;
    }
    specsHTML += `<div class="spec-label"><strong>Medidas (mm)</strong></div><div class="spec-value">${medidasHTML}</div>`;
    const specsSet = new Set<string>();
    if (Array.isArray(item.aplicaciones)) {
        item.aplicaciones.forEach(app => {
            if (app.especificacion && app.especificacion.trim() !== '') {
                specsSet.add(app.especificacion.trim());
            }
        });
    }
    if (specsSet.size > 0) {
        const uniqueSpecs = Array.from(specsSet).sort();
        const specsContent = uniqueSpecs.length > 1
            ? `<ul class="spec-list"><li>${uniqueSpecs.join('</li><li>')}</li></ul>`
            : uniqueSpecs[0];
        specsHTML += `<div class="spec-label"><strong>Especificación</strong></div><div class="spec-value specs-highlight">${specsContent}</div>`;
    } else {
        specsHTML += `<div class="spec-label"><strong>Especificación</strong></div><div class="spec-value">N/A</div>`;
    }
    specsHTML += `</div>`;
    return specsHTML;
};

const itemsPerPage = 24;

function setupPagination(totalItems: number) {
    els.paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return;
    let paginationHTML = '';
    paginationHTML += `<button class="page-btn" data-page="${appState.currentPage - 1}" ${appState.currentPage === 1 ? 'disabled' : ''}>Anterior</button>`;
    const maxPagesToShow = 5;
    const halfPages = Math.floor(maxPagesToShow / 2);
    let startPage, endPage;
    if (totalPages <= maxPagesToShow) {
        startPage = 1;
        endPage = totalPages;
    } else if (appState.currentPage <= halfPages + 1) {
        startPage = 1;
        endPage = maxPagesToShow;
    } else if (appState.currentPage >= totalPages - halfPages) {
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
    } else {
        startPage = appState.currentPage - halfPages;
        endPage = appState.currentPage + halfPages;
    }
    if (startPage > 1) {
        paginationHTML += `<button class="page-btn" data-page="1">1</button>`;
        if (startPage > 2) paginationHTML += `<button class="page-btn" disabled>...</button>`;
    }
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<button class="page-btn ${i === appState.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) paginationHTML += `<button class="page-btn" disabled>...</button>`;
        paginationHTML += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
    }
    paginationHTML += `<button class="page-btn" data-page="${appState.currentPage + 1}" ${appState.currentPage === totalPages ? 'disabled' : ''}>Siguiente</button>`;
    els.paginationContainer.innerHTML = paginationHTML;
}

const renderCurrentPage = () => {
    const totalResults = appState.filtered.length;
    const startIndex = (appState.currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = appState.filtered.slice(startIndex, endIndex);
    const startNum = totalResults === 0 ? 0 : startIndex + 1;
    const endNum = Math.min(endIndex, totalResults);
    els.countContainer.innerHTML = `Mostrando <strong>${startNum}–${endNum}</strong> de <strong>${totalResults}</strong> resultados`;

    if (totalResults === 0) {
        const message = appState.isFavoritesMode ? 'No tienes favoritos guardados' : 'No se encontraron pastillas';
        const subMessage = appState.isFavoritesMode ? 'Haz clic en el corazón de una pastilla para guardarla.' : 'Intenta ajustar tus filtros de búsqueda.';
        els.results.innerHTML = `<div class="no-results-container"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"></path><path d="M21 21L16.65 16.65"></path><path d="M11 8V11L13 13"></path></svg><p>${message}</p><span>${subMessage}</span></div>`;
        els.paginationContainer.innerHTML = '';
        return;
    }

    els.results.innerHTML = paginatedData.map((item: Product, index: number) => {
        const safeAplicaciones = Array.isArray(item.aplicaciones) ? item.aplicaciones : [];
        const posText = (item.posición || '').toLowerCase();
        const reFront = /\bdel(antera)?\b/i;
        const reRear = /\btras(era)?\b/i;
        const resolvedPositions = safeAplicaciones.map(a => {
            const appPos = (a.posicion || '').toLowerCase();
            return (appPos && appPos !== 'n/a') ? appPos : posText;
        }).filter(p => p && p !== 'n/a');
        const positionsToAnalyze = resolvedPositions.length > 0 ? resolvedPositions : [posText];
        const effectiveIsFront = positionsToAnalyze.some(p => reFront.test(p) || p.includes('ambas') || (p.includes('del') && p.includes('tras')));
        const effectiveIsRear = positionsToAnalyze.some(p => reRear.test(p) || p.includes('ambas') || (p.includes('del') && p.includes('tras')));
        const isAmbasCalculated = effectiveIsFront && effectiveIsRear;
        let positionBadgesHTML = '';
        if (isAmbasCalculated) {
            positionBadgesHTML = `<span class="position-badge-premium ambas">delantera/trasera</span>`;
        } else if (effectiveIsFront) {
            positionBadgesHTML = `<span class="position-badge-premium delantera">Delantera</span>`;
        } else if (effectiveIsRear) {
            positionBadgesHTML = `<span class="position-badge-premium trasera">Trasera</span>`;
        } else {
            if (item.posición && item.posición !== 'N/A') {
                positionBadgesHTML = `<span class="position-badge-premium">${item.posición}</span>`;
            }
        }
        let firstImageSrc = getPlaceholderImage('Sin Imagen');
        if (item.imagenes && item.imagenes.length > 0) {
            firstImageSrc = item.imagenes[0];
        } else if (item.imagen) {
            if (item.imagen.includes('http')) {
                firstImageSrc = item.imagen.replace("text=", `text=Vista+1+`);
            } else {
                firstImageSrc = item.imagen;
            }
        }
        const appSummaryItems = safeAplicaciones
            .map(app => `${app.marca} ${app.serie}`)
            .filter((value, index, self) => self.indexOf(value) === index)
            .slice(0, 3);
        const primaryRefForData = (Array.isArray(item.ref) && item.ref.length > 0) ? String(item.ref[0]).split(' ')[0] : 'N/A';
        const isFavorite = appState.isFavorite(item._appId);
        const isComparison = appState.isComparison(item._appId);
        const favoriteBtnHTML = `
            <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-id="${item._appId}" aria-label="Marcar como favorito" aria-pressed="${isFavorite}">
                <svg class="heart-icon" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
            </button>
        `;
        const compareBtnHTML = `
            <button class="compare-btn ${isComparison ? 'active' : ''}" data-id="${item._appId}" aria-label="Comparar" aria-pressed="${isComparison}">
                 <svg class="compare-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M7 10h14l-4-4" />
                    <path d="M17 14H3l4 4" />
                </svg>
            </button>
        `;
        const allRefsHTML = (Array.isArray(item.ref) && item.ref.length > 0)
            ? item.ref.flatMap(ref => String(ref).split(' '))
                .slice(0, 5)
                .map(ref => `<span class="ref-badge card-ref-badge ${getRefBadgeClass(ref)}">${ref}</span>`)
                .join('')
            : '<span class="ref-badge ref-badge-na card-ref-badge">N/A</span>';

        return `
            <article class="product-card search-result-item" data-id="${item._appId}" style="animation-delay: ${index * 50}ms" role="button" tabindex="0">
                <div class="product-card__header-bar">
                    <div class="product-card__position-wrapper">
                        ${positionBadgesHTML}
                    </div>
                    <div class="product-card__actions-wrapper">
                        ${compareBtnHTML.replace('compare-btn', 'product-card__compare-btn')}
                        ${favoriteBtnHTML.replace('favorite-btn', 'product-card__favorite-btn')}
                    </div>
                </div>
                <div class="product-card__image-container">
                    <img src="${firstImageSrc}" alt="${primaryRefForData}" class="product-card__image" loading="lazy"> 
                </div>
                <div class="product-card__body">
                    <div class="product-card__refs">
                        ${allRefsHTML}
                    </div>
                    <footer class="product-card__footer">
                        <p class="product-card__apps">
                            ${appSummaryItems.length > 0 ? appSummaryItems.join(', ') : 'Aplicaciones no disponibles'}
                        </p>
                    </footer>
                </div>
            </article>
        `;
    }).join('');

    // Listeners will be delegated to container in setupEventListeners
    setupPagination(totalResults);
};

function renderDynamicBrandTags(data: Product[], isFiltered: boolean) {
    if (!els.brandTagsContainer) return;
    const allBrandsList = data.flatMap(item => (item.aplicaciones || []).map(app => app.marca)).filter(Boolean);
    const brandFrequencies = allBrandsList.reduce((counts: Record<string, number>, brand) => {
        counts[brand] = (counts[brand] || 0) + 1;
        return counts;
    }, {});
    let brandsToShow: string[] = [];
    if (isFiltered) {
        brandsToShow = Object.entries(brandFrequencies)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 10)
            .map(([brand]) => brand);
    } else {
        const allUniqueBrands = Object.keys(brandFrequencies);
        const shuffled = [...allUniqueBrands].sort(() => 0.5 - Math.random());
        brandsToShow = shuffled.slice(0, 10);
    }
    const activeBrandFilter = els.marca.value.trim().toLowerCase();
    els.brandTagsContainer.innerHTML = brandsToShow.map(brand => {
        const isActive = brand.toLowerCase() === activeBrandFilter;
        return `<button class="brand-tag ${isActive ? 'active' : ''}" data-brand="${brand}">${brand}</button>`;
    }).join('');
    els.brandTagsContainer.style.display = brandsToShow.length ? 'flex' : 'none';
}

function handleCardClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target) return;

    // Handle Favorite Button click
    const favBtn = target.closest('.product-card__favorite-btn') as HTMLElement;
    if (favBtn) {
        event.stopPropagation();
        const itemId = favBtn.dataset.id;
        if (itemId) {
            const isFav = appState.toggleFavorite(itemId);
            favBtn.classList.toggle('active', isFav);
            favBtn.setAttribute('aria-pressed', isFav ? 'true' : 'false');
        }
        return;
    }

    // Handle Comparison Button click
    const compBtn = target.closest('.product-card__compare-btn') as HTMLElement;
    if (compBtn) {
        event.stopPropagation();
        const itemId = compBtn.dataset.id;
        if (itemId) {
            const isComp = appState.toggleComparison(itemId);
            compBtn.classList.toggle('active', isComp);
            compBtn.setAttribute('aria-pressed', isComp ? 'true' : 'false');
        }
        return;
    }

    // Handle Card click (open modal)
    const card = target.closest('.product-card') as HTMLElement;
    if (card) {
        const itemId = card.dataset.id;
        const itemData = appState.data.find((item: Product) => String(item._appId) === itemId);
        if (itemData) openModal(itemData);
    }
}

function updateScrollIndicator() {
    const wrapper = els.modalDetailsWrapper;
    const content = els.modalDetailsContent;
    if (wrapper && content) {
        const isScrollable = content.scrollHeight > content.clientHeight;
        const isAtBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 5;
        wrapper.classList.toggle('scrollable', isScrollable && !isAtBottom);
    }
}

function openModal(item: Product) {
    const refsHeaderHTML = (Array.isArray(item.ref) && item.ref.length > 0)
        ? item.ref.flatMap((ref: any) => String(ref).split(' '))
            .map((part: string) => `<span class="ref-badge header-ref-badge ${getRefBadgeClass(part)}">${part}</span>`)
            .join('')
        : '<span class="ref-badge ref-badge-na header-ref-badge">N/A</span>';
    els.modalRef.innerHTML = `<div class="modal-header-ref-container">${refsHeaderHTML}</div>`;
    const safeAppsModal = Array.isArray(item.aplicaciones) ? item.aplicaciones : [];
    const posTextModal = (item.posición || '').toLowerCase();
    const reFront = /\bdel(antera)?\b/i;
    const reRear = /\btras(era)?\b/i;
    const resolvedPositionsModal = safeAppsModal.map((a: Application) => {
        const appPos = (a.posicion || '').toLowerCase();
        return (appPos && appPos !== 'n/a') ? appPos : posTextModal;
    }).filter(p => p && p !== 'n/a');
    const positionsToAnalyzeModal = resolvedPositionsModal.length > 0 ? resolvedPositionsModal : [posTextModal];
    const effectiveIsFront = positionsToAnalyzeModal.some(p => reFront.test(p) || p.includes('ambas') || (p.includes('del') && p.includes('tras')));
    const effectiveIsRear = positionsToAnalyzeModal.some(p => reRear.test(p) || p.includes('ambas') || (p.includes('del') && p.includes('tras')));
    const isAmbasCalculated = effectiveIsFront && effectiveIsRear;
    let posBadgeClass = '';
    let posBadgeText = item.posición || 'N/A';
    if (isAmbasCalculated) {
        posBadgeClass = 'ambas';
        posBadgeText = 'delantera/trasera';
    } else if (effectiveIsFront) {
        posBadgeClass = 'delantera';
        if (!posBadgeText || posBadgeText === 'N/A' || !reFront.test(posBadgeText)) posBadgeText = 'Delantera';
    } else if (effectiveIsRear) {
        posBadgeClass = 'trasera';
        if (!posBadgeText || posBadgeText === 'N/A' || !reRear.test(posBadgeText)) posBadgeText = 'Trasera';
    }
    els.modalPosition.innerHTML = `<span class="position-badge-premium ${posBadgeClass}">${posBadgeText}</span>`;
    let images = [];
    if (item.imagenes && item.imagenes.length > 0) {
        images = item.imagenes;
    } else if (item.imagen) {
        images = [
            item.imagen.replace("text=", `text=Vista+1+`),
            item.imagen.replace("text=", `text=Vista+2+`),
            item.imagen.replace("text=", `text=Vista+3+`)
        ];
    } else {
        images = ['https://via.placeholder.com/300x200.png?text=No+Img'];
    }
    const imageTrackHTML = images.map((imgSrc, i) =>
        `<img src="${imgSrc}" alt="Referencia ${item.ref?.[0] || 'N/A'} Vista ${i + 1}" class="result-image">`
    ).join('');
    els.modalCarousel.innerHTML = `
    <div class="image-track" style="display:flex;" data-current-index="0">${imageTrackHTML}</div>
        ${images.length > 1 ? `
            <button class="carousel-nav-btn" data-direction="-1" aria-label="Imagen anterior">‹</button>
            <button class="carousel-nav-btn" data-direction="1" aria-label="Siguiente imagen">›</button>
        ` : ''
        }
`;
    els.modalCarousel.querySelectorAll('.carousel-nav-btn').forEach((btn: Element) => {
        (btn as HTMLElement).onclick = (e) => {
            e.stopPropagation();
            const current = e.currentTarget as HTMLElement;
            const direction = parseInt(current.dataset.direction || '0');
            navigateCarousel(els.modalCarousel, direction);
        };
    });
    if (images.length > 1) {
        els.modalCounterWrapper.innerHTML = `<span class="carousel-counter">1 / ${images.length}</span>`;
    } else {
        els.modalCounterWrapper.innerHTML = '';
    }
    els.modalAppsSpecs.innerHTML = `<div class="applications-list-container">${renderApplicationsList(item.aplicaciones, item.posición || '')}${renderSpecs(item)}</div>`;
    els.modalContent.classList.remove('closing');
    els.modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Solo si el handler está definido globalmente
    if (typeof handleFocusTrap !== 'undefined') {
        els.modal.addEventListener('keydown', handleFocusTrap);
    }
    els.modalCloseBtn.focus();
    requestAnimationFrame(() => {
        setTimeout(() => {
            updateScrollIndicator();
            els.modalDetailsContent.addEventListener('scroll', updateScrollIndicator);
        }, 100);
    });
}

function navigateCarousel(carouselContainer: HTMLElement, direction: number) {
    const track = carouselContainer.querySelector('.image-track') as HTMLElement;
    const images = carouselContainer.querySelectorAll('.result-image');
    const counter = els.modalCounterWrapper.querySelector('.carousel-counter');
    if (!track || images.length <= 1) return;
    let currentIndex = parseInt(track.dataset.currentIndex || '0') || 0;
    const totalImages = images.length;
    let newIndex = currentIndex + direction;
    if (newIndex >= totalImages) newIndex = 0;
    else if (newIndex < 0) newIndex = totalImages - 1;
    track.style.transform = `translateX(-${newIndex * 100}%)`;
    track.dataset.currentIndex = String(newIndex);
    if (counter) counter.textContent = `${newIndex + 1}/${totalImages}`;
}

function closeModal() {
    els.modalContent.classList.add('closing');
    els.modalDetailsContent.removeEventListener('scroll', updateScrollIndicator);
    els.modalDetailsWrapper.classList.remove('scrollable');
    if (typeof handleFocusTrap !== 'undefined') els.modal.removeEventListener('keydown', handleFocusTrap);
    setTimeout(() => {
        els.modal.style.display = 'none';
        document.body.style.overflow = '';
        els.modalCarousel.innerHTML = '';
        els.modalRef.innerHTML = '';
        els.modalPosition.innerHTML = '';
        els.modalAppsSpecs.innerHTML = '';
        els.modalCounterWrapper.innerHTML = '';
        els.modalContent.classList.remove('closing');
    }, 220);
}

function openGuideModal() {
    els.guideModalContent.classList.remove('closing');
    els.guideModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (typeof handleFocusTrap !== 'undefined') els.guideModal.addEventListener('keydown', handleFocusTrap);
    els.guideModalCloseBtn.focus();
}

function closeGuideModal() {
    els.guideModalContent.classList.add('closing');
    if (typeof handleFocusTrap !== 'undefined') els.guideModal.removeEventListener('keydown', handleFocusTrap);
    setTimeout(() => {
        els.guideModal.style.display = 'none';
        document.body.style.overflow = '';
        els.guideModalContent.classList.remove('closing');
    }, 220);
}

const getPositionFilter = () => {
    const activePositions = [];
    if (els.posDel.classList.contains('active')) activePositions.push('Delantera');
    if (els.posTras.classList.contains('active')) activePositions.push('Trasera');
    return activePositions;
};

function handleFocusTrap(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    const target = e.currentTarget as HTMLElement;
    const focusableElements = target.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select'
    ) as NodeListOf<HTMLElement>;
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
        if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
        }
    } else {
        if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
        }
    }
}

function setupComparisonModal() {
    const closeModalBtn = document.querySelector('#comparisonModal .modal-close-btn') as HTMLElement;
    const modal = document.getElementById('comparisonModal');
    if (closeModalBtn && modal) {
        closeModalBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        modal.addEventListener('click', (e: MouseEvent) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }
}

function renderComparisonView() {
    const container = document.getElementById('comparisonContent');
    if (!container) return;
    const items = appState.data.filter((item: Product) => appState.comparisons.has(item._appId));
    container.innerHTML = items.map((item: Product) => `
        <div class="comparison-column" style="min-width: 300px; max-width: 350px; display: flex; flex-direction: column; gap: 1rem; border-right: 1px solid var(--material-surface-border); padding-right: 1rem;">
            <div class="comp-header">
                <img src="${item.imagenes && item.imagenes[0] ? item.imagenes[0] : 'https://via.placeholder.com/300'}" style="width: 100%; height: 200px; object-fit: contain;">
                <h3 style="margin-top: 1rem;">${item.ref ? item.ref[0] : 'N/A'}</h3>
                <span class="position-badge-premium ${item.posicion ? item.posicion.toLowerCase() : ''}">${item.posicion || 'N/A'}</span>
            </div>
            <div class="comp-specs">
                <div class="spec-row"><strong>Medidas:</strong> ${item.anchoNum} x ${item.altoNum} mm</div>
                <div class="spec-row"><strong>Espesor:</strong> ${item.Espesor || '-'} mm</div>
                <div class="spec-row"><strong>WVA:</strong> ${item.wva || '-'}</div>
                <div class="spec-row"><strong>Sistema:</strong> ${item.sistema || '-'}</div>
            </div>
            <div class="comp-apps" style="flex: 1; overflow-y: auto;">
                <strong>Aplicaciones:</strong>
                <ul style="font-size: 0.8rem; padding-left: 1.2rem;">
                    ${item.aplicaciones.slice(0, 5).map((app: Application) => `<li>${app.marca} ${app.serie} ${app.año}</li>`).join('')}
                </ul>
            </div>
        </div>
    `).join('');
}



