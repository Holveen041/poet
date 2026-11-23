/* Логика статической версии проекта.
   Поведение перенесено 1:1 из React-компонентов (App, Header, Tab1–Tab6,
   PresentationFooter, crossword.ts, quiz.ts). */

(function () {
  'use strict';

  var D = window.DATA;

  /* ------------------------------------------------------------------------
     Иконки (lucide, inline SVG)
     ------------------------------------------------------------------------ */

  var ICON_PATHS = {
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    arrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    image:
      '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    lock:
      '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    keyboard:
      '<path d="M10 8h.01"/><path d="M12 12h.01"/><path d="M14 8h.01"/><path d="M16 12h.01"/><path d="M18 8h.01"/><path d="M6 8h.01"/><path d="M7 16h10"/><path d="M8 12h.01"/><rect width="20" height="16" x="2" y="4" rx="2"/>',
    rotate:
      '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    award:
      '<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/>',
  };

  function icon(name, className) {
    return (
      '<span class="' +
      (className || 'icon') +
      '" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      ICON_PATHS[name] +
      '</svg></span>'
    );
  }

  /* ------------------------------------------------------------------------
     Состояние приложения
     ------------------------------------------------------------------------ */

  var state = {
    activeTab: 'origins',
    menuOpen: false,
    poetState: 'ordinary',
    dialogueIndex: 0,
    freedomStep: 1,
    factId: D.MANUSCRIPT_FACTS[0].id,
    directionId: D.XXI_CENTURY_DIRECTIONS[0].id,
    mode: 'quiz',
    quiz: { currentIdx: 0, answers: {}, showSummary: false },
  };

  /* Кроссворд */
  var cw = {
    entries: {},
    revealed: new Set(),
    activeWordId: 1,
    activeRow: 0,
    activeCol: 2,
    evaluation: null,
    notice: null,
    confettiTimer: null,
  };

  var grid = buildCrosswordGrid();

  /* ------------------------------------------------------------------------
     Ссылки на DOM
     ------------------------------------------------------------------------ */

  var mainNav = document.getElementById('mainNav');
  var mobileMenu = document.getElementById('mobileMenu');
  var mobileMenuGrid = document.getElementById('mobileMenuGrid');
  var mobileCurrent = document.getElementById('mobileCurrent');
  var menuButton = document.getElementById('menuButton');
  var menuButtonIcon = document.getElementById('menuButtonIcon');
  var brandButton = document.getElementById('brandButton');
  var breadcrumbSection = document.getElementById('breadcrumbSection');
  var pageTitle = document.getElementById('pageTitle');
  var pageSubtitle = document.getElementById('pageSubtitle');
  var tabPanel = document.getElementById('tabPanel');
  var prevButton = document.getElementById('prevButton');
  var nextButton = document.getElementById('nextButton');
  var prevLabel = document.getElementById('prevLabel');
  var nextLabel = document.getElementById('nextLabel');
  var footerMobileCount = document.getElementById('footerMobileCount');
  var footerSlide = document.getElementById('footerSlide');

  /* ------------------------------------------------------------------------
     Общие помощники
     ------------------------------------------------------------------------ */

  function tabMeta(id) {
    return (
      D.PROJECT_TABS.filter(function (t) {
        return t.id === id;
      })[0] || D.PROJECT_TABS[0]
    );
  }

  function activeIndex() {
    return D.PROJECT_TABS.findIndex(function (t) {
      return t.id === state.activeTab;
    });
  }

  function pointList(points, modifier) {
    var dash = 'point__dash' + (modifier ? ' ' + modifier : '');
    return points
      .map(function (p) {
        return (
          '<li class="point"><span class="' +
          dash +
          '" aria-hidden="true">—</span><span>' +
          p +
          '</span></li>'
        );
      })
      .join('');
  }

  function figureSlot(opts) {
    var contain = opts.fit === 'contain';
    return (
      '<figure class="figure">' +
      '<div class="figure__frame figure__frame--' +
      opts.aspect +
      (contain ? ' figure__frame--contain' : '') +
      '"' +
      (contain
        ? ' style="--figure-aspect:' + (opts.ratioCss || '3 / 4') + '"'
        : '') +
      ' data-figure-frame>' +
      '<img class="figure__img" src="' +
      opts.src +
      '" alt="' +
      opts.alt +
      '" referrerpolicy="no-referrer" data-figure-img>' +
      '<div class="figure__placeholder">' +
      '<div class="figure__meta">' +
      '<span class="figure__number">' +
      opts.figureNumber +
      '</span>' +
      '<span class="figure__ratio">' +
      opts.recommendedRatio +
      '</span>' +
      '</div>' +
      '<div class="figure__center">' +
      '<div class="figure__icon">' +
      icon('image') +
      '</div>' +
      '<div class="figure__text">' +
      '<p class="figure__title">' +
      opts.title +
      '</p>' +
      '<p class="figure__alt">' +
      opts.alt +
      '</p>' +
      '</div>' +
      '</div>' +
      '<div class="figure__path">Путь для вставки в коде: <code>' +
      opts.src +
      '</code></div>' +
      '</div>' +
      '</div>' +
      '<figcaption class="figure__caption">' +
      '<span class="figure__caption-text">' +
      opts.figureNumber +
      '. ' +
      opts.caption +
      '</span>' +
      '</figcaption>' +
      '</figure>'
    );
  }

  function initFigures(root) {
    var images = root.querySelectorAll('[data-figure-img]');
    Array.prototype.forEach.call(images, function (img) {
      var frame = img.closest('[data-figure-frame]');
      if (!frame) return;
      var markLoaded = function () {
        frame.classList.add('is-loaded');
      };
      var markFailed = function () {
        frame.classList.remove('is-loaded');
      };
      img.addEventListener('load', markLoaded);
      img.addEventListener('error', markFailed);
      if (img.complete) {
        if (img.naturalWidth > 0) {
          markLoaded();
        } else {
          markFailed();
        }
      }
    });
  }

  /* ------------------------------------------------------------------------
     Шапка
     ------------------------------------------------------------------------ */

  function renderHeader() {
    mainNav.innerHTML = D.PROJECT_TABS.map(function (tab) {
      var active = tab.id === state.activeTab;
      return (
        '<button type="button" class="nav-link' +
        (active ? ' is-active' : '') +
        '" data-tab-id="' +
        tab.id +
        '"' +
        (active ? ' aria-current="page"' : '') +
        '>' +
        tab.shortTitle +
        '</button>'
      );
    }).join('');

    mobileMenuGrid.innerHTML = D.PROJECT_TABS.map(function (tab) {
      var active = tab.id === state.activeTab;
      return (
        '<button type="button" class="mobile-menu__item' +
        (active ? ' is-active' : '') +
        '" data-tab-id="' +
        tab.id +
        '"' +
        (active ? ' aria-current="page"' : '') +
        '><span>' +
        tab.shortTitle +
        '</span></button>'
      );
    }).join('');

    mobileCurrent.textContent = tabMeta(state.activeTab).shortTitle;
  }

  function setMenuOpen(open) {
    state.menuOpen = open;
    mobileMenu.hidden = !open;
    menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuButton.setAttribute(
      'aria-label',
      open ? 'Закрыть меню разделов' : 'Открыть меню разделов'
    );
    menuButtonIcon.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">' +
      (open ? ICON_PATHS.close : ICON_PATHS.menu) +
      '</svg>';
  }

  /* ------------------------------------------------------------------------
     Заголовок раздела и подвал
     ------------------------------------------------------------------------ */

  function renderPageHeader() {
    var meta = tabMeta(state.activeTab);
    breadcrumbSection.textContent =
      'Раздел ' + meta.number + ' из 0' + D.PROJECT_TABS.length;
    pageTitle.textContent = meta.fullTitle;
    pageSubtitle.textContent = meta.subtitle;
  }

  function renderFooter() {
    var idx = activeIndex();
    var tabs = D.PROJECT_TABS;
    var prev = idx > 0 ? tabs[idx - 1] : null;
    var next = idx < tabs.length - 1 ? tabs[idx + 1] : null;

    prevButton.disabled = !prev;
    nextButton.disabled = !next;
    prevLabel.textContent = prev ? '· ' + prev.number : '';
    nextLabel.textContent = next ? '· ' + next.shortTitle : '';

    footerMobileCount.textContent =
      'Раздел ' + (idx + 1) + ' из ' + tabs.length;
    footerSlide.textContent = 'Слайд ' + (idx + 1) + ' из ' + tabs.length;
  }

  /* ------------------------------------------------------------------------
     Сброс локального состояния раздела (в React состояние живёт в компоненте
     и исчезает при переключении вкладки)
     ------------------------------------------------------------------------ */

  function resetQuizState() {
    state.quiz = { currentIdx: 0, answers: {}, showSummary: false };
  }

  function resetCrosswordState() {
    cw.entries = {};
    cw.revealed = new Set();
    cw.activeWordId = 1;
    cw.activeRow = 0;
    cw.activeCol = 2;
    cw.evaluation = null;
    cw.notice = null;
    clearConfetti();
  }

  function resetTabState(tabId) {
    if (tabId === 'origins') {
      state.poetState = 'ordinary';
    } else if (tabId === 'crowd') {
      state.dialogueIndex = 0;
    } else if (tabId === 'freedom') {
      state.freedomStep = 1;
    } else if (tabId === 'workshop') {
      state.factId = D.MANUSCRIPT_FACTS[0].id;
    } else if (tabId === 'modern') {
      state.directionId = D.XXI_CENTURY_DIRECTIONS[0].id;
    } else if (tabId === 'interactive') {
      state.mode = 'quiz';
      resetQuizState();
      resetCrosswordState();
    }
  }

  /* ------------------------------------------------------------------------
     Переключение разделов
     ------------------------------------------------------------------------ */

  function selectTab(id, options) {
    var opts = options || {};
    if (!D.PROJECT_TABS.some(function (t) { return t.id === id; })) return;

    if (id === state.activeTab) {
      setMenuOpen(false);
      if (opts.scroll !== false) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      return;
    }

    resetTabState(state.activeTab);
    state.activeTab = id;
    setMenuOpen(false);
    renderHeader();
    renderPageHeader();
    renderTab({ animate: true });
    renderFooter();

    if (opts.scroll !== false) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  /* ------------------------------------------------------------------------
     Отрисовка активного раздела
     ------------------------------------------------------------------------ */

  function renderTab(options) {
    var opts = options || {};
    var html = '';

    if (state.activeTab === 'origins') html = renderOrigins();
    else if (state.activeTab === 'crowd') html = renderCrowd();
    else if (state.activeTab === 'freedom') html = renderFreedom();
    else if (state.activeTab === 'workshop') html = renderWorkshop();
    else if (state.activeTab === 'modern') html = renderModern();
    else html = renderInteractive();

    tabPanel.innerHTML = html;

    initFigures(tabPanel);

    if (state.activeTab === 'interactive' && state.mode === 'crossword') {
      initCrossword();
    }

    if (opts.animate) {
      tabPanel.classList.remove('tab-panel');
      void tabPanel.offsetWidth;
      tabPanel.classList.add('tab-panel');
    }
  }

  function rerenderTab() {
    var sig = captureFocus();
    renderTab();
    restoreFocus(sig);
  }

  function captureFocus() {
    var el = document.activeElement;
    if (!el || !tabPanel.contains(el) || !el.dataset.action) return null;
    var sig = {};
    Object.keys(el.dataset).forEach(function (key) {
      sig[key] = el.dataset[key];
    });
    return sig;
  }

  function restoreFocus(sig) {
    if (!sig) return;
    var candidates = tabPanel.querySelectorAll('[data-action]');
    for (var i = 0; i < candidates.length; i += 1) {
      var el = candidates[i];
      var match = true;
      for (var key in sig) {
        if (el.dataset[key] !== sig[key]) {
          match = false;
          break;
        }
      }
      if (match) {
        el.focus({ preventScroll: true });
        return;
      }
    }
  }

  /* ------------------------------------------------------------------------
     Раздел 01. Истоки и «Поэт»
     ------------------------------------------------------------------------ */

  function renderOrigins() {
    var mode = state.poetState;
    var data = D.POET_1827_STATES[mode];
    var inspired = mode === 'inspired';

    var cards = D.EVOLUTION_CARDS.map(function (card, index) {
      return (
        '<article class="evolution-card' +
        (index === 2 ? ' evolution-card--featured' : '') +
        '">' +
        '<div>' +
        '<p class="evolution-card__era">' +
        card.era +
        '</p>' +
        '<h3 class="evolution-card__author">' +
        card.author +
        '</h3>' +
        '<p class="evolution-card__work">' +
        card.work +
        '</p>' +
        '<p class="evolution-card__thesis">' +
        card.thesis +
        '</p>' +
        '<ul class="point-list">' +
        pointList(card.points) +
        '</ul>' +
        '</div>' +
        '</article>'
      );
    }).join('');

    var switchCards =
      '<div class="switch-grid" role="tablist" aria-label="Состояния поэта в стихотворении 1827 года">' +
      '<button type="button" role="tab" aria-selected="' +
      (!inspired ? 'true' : 'false') +
      '" data-action="poet-state" data-state="ordinary" class="switch-card' +
      (!inspired ? ' is-ink' : '') +
      '">' +
      '<span class="switch-card__hint">Антитеза · Состояние I</span>' +
      '<span class="switch-card__title">В обыденной жизни</span>' +
      '</button>' +
      '<button type="button" role="tab" aria-selected="' +
      (inspired ? 'true' : 'false') +
      '" data-action="poet-state" data-state="inspired" class="switch-card switch-card--inspired' +
      (inspired ? ' is-burgundy' : '') +
      '">' +
      '<span class="switch-card__hint">Антитеза · Состояние II</span>' +
      '<span class="switch-card__title">В момент вдохновения</span>' +
      '</button>' +
      '</div>';

    var poemLines = data.lines
      .map(function (line) {
        var cls = 'poem-line';
        if (line.highlight) {
          cls += inspired ? ' poem-line--burgundy' : ' poem-line--gold';
        }
        return '<span class="' + cls + '">' + line.text + '</span>';
      })
      .join('');

    var epithets = data.epithets
      .map(function (item) {
        return (
          '<div>' +
          '<dt class="' +
          (inspired ? 'is-burgundy' : '') +
          '">«' +
          item.word +
          '»</dt>' +
          '<dd>' +
          item.note +
          '</dd>' +
          '</div>'
        );
      })
      .join('');

    return (
      '<div class="tab-view">' +
      '<section class="section" aria-labelledby="evolution-heading">' +
      '<div class="section-head">' +
      '<h2 class="section-title" id="evolution-heading">От античной оды к свободе творца</h2>' +
      '<span class="section-note">Три исторические ступени осмысления миссии поэта</span>' +
      '</div>' +
      '<div class="evolution-grid">' +
      cards +
      '</div>' +
      '</section>' +

      '<section class="poet-section" aria-labelledby="poet-switch-heading">' +
      '<div class="poet-section__media">' +
      figureSlot({
        src: 'images/pushkin-mikhailovskoe.jpg',
        alt: 'Пушкин в Михайловском',
        figureNumber: 'Илл. 01',
        title: 'А. С. Пушкин в селе Михайловском',
        caption:
          'Уединение в Михайловском — время глубокого размышления о природе вдохновения и внутренней свободе поэта.',
        aspect: '3x4',
        recommendedRatio: '3:4 · Портрет',
        fit: 'contain',
        ratioCss: '550 / 379',
      }) +
      '</div>' +
      '<div class="poet-section__content">' +
      '<div class="block-heading">' +
      '<p class="eyebrow">Интерактивный разбор · 1827 год</p>' +
      '<h2 class="section-title" id="poet-switch-heading">Двоемирие в стихотворении «Поэт»</h2>' +
      '<p class="lead">Переключайте два состояния героя, чтобы проследить антитезу между бытовым существованием и мгновением творческого озарения.</p>' +
      '</div>' +
      switchCards +
      '<div class="poem-panel">' +
      '<p class="poem-panel__summary">' +
      data.summary +
      '</p>' +
      '<div class="poem-panel__grid">' +
      '<div class="poem-panel__poem">' +
      '<blockquote class="poem-block">' +
      poemLines +
      '</blockquote>' +
      '</div>' +
      '<div class="poem-notes">' +
      '<p class="notes-label">Ключевые образы и эпитеты</p>' +
      '<dl class="notes-list">' +
      epithets +
      '</dl>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</section>' +

      '<section class="romantics" aria-labelledby="romantics-note">' +
      '<div class="romantics__grid">' +
      '<div class="romantics__intro">' +
      '<h3 class="romantics__title" id="romantics-note">Параллель с философией романтизма</h3>' +
      '<p class="romantics__intro-text">Поэзия как уход от грубой прозаической реальности в идеальный мир гармонии и мечты.</p>' +
      '</div>' +
      '<div class="romantics__items">' +
      '<div>' +
      '<p class="romantics__name">В. А. Жуковский</p>' +
      '<p class="romantics__item-text">В элегии «Невыразимое» (1819) утвердил двоемирие романтиков: высокий мир души противостоит суетной земной обыденности.</p>' +
      '</div>' +
      '<div>' +
      '<p class="romantics__name">К. Н. Батюшков</p>' +
      '<p class="romantics__item-text">Воспевал поэзию как спасительное убежище от грубой действительности — область красоты, «сладких звуков» и сердечной свободы.</p>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</section>' +
      '</div>'
    );
  }

  /* ------------------------------------------------------------------------
     Раздел 02. Поэт и толпа
     ------------------------------------------------------------------------ */

  function renderCrowd() {
    var active = D.CROWD_DIALOGUE[state.dialogueIndex];

    var contextCards = D.CROWD_CONTEXT_CARDS.map(function (card, i) {
      return (
        '<article class="context-card">' +
        '<p class="context-card__reason">Причина 0' +
        (i + 1) +
        '</p>' +
        '<h3>' +
        card.title +
        '</h3>' +
        '<p>' +
        card.detail +
        '</p>' +
        '</article>'
      );
    }).join('');

    var dialogueTabs = D.CROWD_DIALOGUE.map(function (item, idx) {
      var selected = idx === state.dialogueIndex;
      var cls = 'dialogue-tab';
      if (selected) cls += item.speaker === 'poet' ? ' is-poet' : ' is-crowd';
      return (
        '<button type="button" data-action="dialogue-select" data-index="' +
        idx +
        '" class="' +
        cls +
        '">' +
        '<span class="dialogue-tab__hint">Реплика ' +
        (idx + 1) +
        ' из ' +
        D.CROWD_DIALOGUE.length +
        '</span>' +
        '<span class="dialogue-tab__label">' +
        item.speakerLabel +
        '</span>' +
        '</button>'
      );
    }).join('');

    function renderLines(speaker, activeClass) {
      return D.CROWD_DIALOGUE.map(function (line, idx) {
        if (line.speaker !== speaker) return '';
        var isActive = line.id === active.id;
        return (
          '<button type="button" data-action="dialogue-select" data-index="' +
          idx +
          '" class="dialogue-line' +
          (isActive ? ' ' + activeClass : '') +
          '">' +
          '<blockquote>' +
          line.quote.split(' / ').join('\n') +
          '</blockquote>' +
          (isActive
            ? '<p class="dialogue-line__comment">' + line.commentary + '</p>'
            : '') +
          '</button>'
        );
      }).join('');
    }

    var crowdActive = active.speaker === 'crowd';
    var poetActive = active.speaker === 'poet';

    return (
      '<div class="tab-view">' +
      '<section class="section" aria-labelledby="crowd-context-heading">' +
      '<div class="section-head">' +
      '<h2 class="section-title" id="crowd-context-heading">Исторический контекст 1828 года</h2>' +
      '<span class="section-note">Стихотворение «Поэт и толпа» (первоначально — «Чернь»)</span>' +
      '</div>' +
      '<div class="context-grid">' +
      contextCards +
      '</div>' +
      '</section>' +

      '<section class="dialogue-section" aria-labelledby="dialogue-heading">' +
      '<div class="dialogue-head">' +
      '<div class="dialogue-head__intro">' +
      '<h2 class="section-title" id="dialogue-heading">Диалог позиций: «Поэт» против «Толпы»</h2>' +
      '<p>Позиция толпы (мораль и практическая выгода) против позиции поэта (искусство не должно быть обслугой).</p>' +
      '</div>' +
      '<div class="dialogue-note" role="note">' +
      '<p><strong>Ключевой образ спора:</strong> для утилитарной толпы «печной горшок дороже Аполлона» — она ценит лишь сиюминутную выгоду, а не красоту.</p>' +
      '</div>' +
      '</div>' +

      '<div class="dialogue-tabs">' +
      dialogueTabs +
      '</div>' +

      '<div class="dialogue-grid">' +
      '<div class="dialogue-column' +
      (crowdActive ? ' is-crowd-active' : '') +
      '">' +
      '<p class="dialogue-column__label">Позиция Толпы · Польза и мораль</p>' +
      '<div class="dialogue-lines">' +
      renderLines('crowd', 'is-active-crowd') +
      '</div>' +
      '</div>' +
      '<div class="dialogue-column dialogue-column--poet' +
      (poetActive ? ' is-poet-active' : '') +
      '">' +
      '<p class="dialogue-column__label dialogue-column__label--poet">Позиция Поэта · Искусство не обслуга</p>' +
      '<div class="dialogue-lines">' +
      renderLines('poet', 'is-active-poet') +
      '</div>' +
      '</div>' +
      '</div>' +
      '</section>' +

      '<section class="manifesto" aria-label="Цитата-манифест из стихотворения Поэт и толпа">' +
      '<p class="manifesto__label">Поэтический манифест · 1828</p>' +
      '<blockquote>Не для житейского волненья,<br>Не для корысти, не для битв,<br>Мы рождены для вдохновенья,<br>Для звуков сладких и молитв.</blockquote>' +
      '</section>' +

      '<section class="parallel-section" aria-labelledby="parallel-heading">' +
      '<div class="parallel-media">' +
      figureSlot({
        src: 'images/poet-and-crowd.jpg',
        alt: 'Иллюстрация к теме «Поэт и толпа»: одинокий поэт и светское общество XIX века',
        figureNumber: 'Илл. 02',
        title: 'Поэт и светская толпа',
        caption:
          'Иллюстрация конфликта творческой независимости и светской суеты.',
        aspect: '4x3',
        recommendedRatio: '4:3 · Сцена',
      }) +
      '</div>' +
      '<div class="parallel-body">' +
      '<div>' +
      '<h3 class="section-title" id="parallel-heading">Развитие темы: Пушкин и Лермонтов</h3>' +
      '<p>Защитив свободу искусства в 1828 году, Пушкин развивает её в сонете, а спустя десять лет Лермонтов переносит конфликт на новую историческую почву.</p>' +
      '</div>' +
      '<div class="parallel-cards">' +
      '<article class="quote-card">' +
      '<div class="quote-card__head">' +
      '<h4>А. С. Пушкин · Сонет «Поэту» (1830)</h4>' +
      '<span class="quote-card__tag">Формула независимости</span>' +
      '</div>' +
      '<p class="quote-card__quote">«Ты царь: живи один. Дорогою свободной / Иди, куда влечёт тебя свободный ум...»</p>' +
      '<p class="quote-card__note">Высший судья художника — он сам; похвала толпы так же скоротечна, как и её осмеяние.</p>' +
      '</article>' +
      '<article class="quote-card quote-card--surface">' +
      '<div class="quote-card__head">' +
      '<h4>М. Ю. Лермонтов · «Поэт» (1838)</h4>' +
      '<span class="quote-card__tag quote-card__tag--burgundy">Клинок и безделушка</span>' +
      '</div>' +
      '<p class="quote-card__quote">«Отделкой золотой блистает мой кинжал; / Клинок надёжный, без порока... / Игрушкой золотой он блещет на стене — / Увы, бесславный и безвредный!»</p>' +
      '<p class="quote-card__note">Лермонтов сравнивает поэзию с боевым клинком, утратившим силу в «изнеженном веке» и ставшим светской безделушкой.</p>' +
      '</article>' +
      '</div>' +
      '</div>' +
      '</section>' +
      '</div>'
    );
  }

  /* ------------------------------------------------------------------------
     Раздел 03. Цена свободного слова
     ------------------------------------------------------------------------ */

  function renderFreedom() {
    var stage =
      D.FREEDOM_STAGES.filter(function (s) {
        return s.step === state.freedomStep;
      })[0] || D.FREEDOM_STAGES[0];

    var stageTabs = D.FREEDOM_STAGES.map(function (item) {
      var selected = item.step === state.freedomStep;
      return (
        '<button type="button" role="tab" aria-selected="' +
        (selected ? 'true' : 'false') +
        '" data-action="freedom-step" data-step="' +
        item.step +
        '" class="stage-tab' +
        (selected ? ' is-active' : '') +
        '">' +
        '<div>' +
        '<div class="stage-tab__top">' +
        '<span class="stage-tab__period">' +
        item.period +
        '</span>' +
        '<span class="stage-tab__number">0' +
        item.step +
        '</span>' +
        '</div>' +
        '<span class="stage-tab__title">' +
        item.title +
        '</span>' +
        '</div>' +
        '<span class="stage-tab__hint">Этап ' +
        item.step +
        ' из 3</span>' +
        '</button>'
      );
    }).join('');

    var works = stage.worksOrEvents
      .map(function (item) {
        return (
          '<li class="point"><span class="point__dash point__dash--burgundy" aria-hidden="true">—</span><span>' +
          item +
          '</span></li>'
        );
      })
      .join('');

    return (
      '<div class="tab-view">' +
      '<section class="section" aria-labelledby="freedom-chronology-heading">' +
      '<div class="section-head">' +
      '<h2 class="section-title" id="freedom-chronology-heading">Хронология «Слово и расплата»</h2>' +
      '<span class="section-note">Выберите этап, чтобы проследить конфликт поэта с властью</span>' +
      '</div>' +
      '<div class="stages" role="tablist" aria-label="Этапы хронологии Слово и расплата">' +
      stageTabs +
      '</div>' +

      '<div class="stage-detail">' +
      '<div class="stage-card">' +
      '<p class="stage-card__eyebrow">Этап 0' +
      stage.step +
      ' · ' +
      stage.period +
      '</p>' +
      '<h3>' +
      stage.title +
      '</h3>' +
      '<p class="stage-card__summary">' +
      stage.summary +
      '</p>' +
      '<ul class="stage-card__list">' +
      works +
      '</ul>' +
      '<blockquote class="stage-card__quote">' +
      stage.quote.split(' / ').join('\n') +
      '</blockquote>' +
      '<div class="stage-card__result"><strong>Итог этапа:</strong> ' +
      stage.consequence +
      '</div>' +
      '</div>' +
      '<div class="stage-media">' +
      figureSlot({
        src: 'images/pushkin-exile.jpg',
        alt: 'Пушкин в ссылке',
        figureNumber: 'Илл. 03',
        title: 'А. С. Пушкин в ссылке',
        caption:
          'Картина «А. С. Пушкин в Михайловском» или иллюстрация к теме ссылки и судьбы декабристов.',
        aspect: '3x4',
        recommendedRatio: '3:4 · Живопись',
      }) +
      '</div>' +
      '</div>' +
      '</section>' +

      '<section class="freedom-outro" aria-labelledby="freedom-quote-heading">' +
      '<div class="freedom-quote">' +
      '<p class="freedom-quote__label">Из послания «К Чаадаеву» · 1818</p>' +
      '<blockquote id="freedom-quote-heading">Товарищ, верь: взойдёт она,<br>Звезда пленительного счастья...</blockquote>' +
      '</div>' +
      '<article class="freedom-why">' +
      '<p class="freedom-why__label">Почему власть боялась поэтического слова</p>' +
      '<h3>Стих сильнее цензурных запретов</h3>' +
      '<p>В стране без свободной печати и парламента поэзия оставалась главной нравственной трибуной. Рифмованная строка мгновенно запоминалась наизусть, переписывалась в десятках списков и объединяла целое поколение — поэтому самодержавие воспринимало свободное слово поэта как прямую политическую угрозу.</p>' +
      '</article>' +
      '</section>' +
      '</div>'
    );
  }

  /* ------------------------------------------------------------------------
     Раздел 04. Мастерская поэта
     ------------------------------------------------------------------------ */

  function renderWorkshop() {
    var myth = D.WORKSHOP_MYTH_REALITY.myth;
    var reality = D.WORKSHOP_MYTH_REALITY.reality;
    var fact =
      D.MANUSCRIPT_FACTS.filter(function (f) {
        return f.id === state.factId;
      })[0] || D.MANUSCRIPT_FACTS[0];

    var factTabs = D.MANUSCRIPT_FACTS.map(function (item) {
      var selected = item.id === state.factId;
      return (
        '<button type="button" role="tab" aria-selected="' +
        (selected ? 'true' : 'false') +
        '" data-action="fact-select" data-id="' +
        item.id +
        '" class="fact-tab' +
        (selected ? ' is-active' : '') +
        '">' +
        '<span class="fact-tab__marker">' +
        item.marker +
        '</span>' +
        '<span class="fact-tab__label">' +
        item.shortLabel +
        '</span>' +
        '</button>'
      );
    }).join('');

    var achievements = D.BOLDINO_ACHIEVEMENTS.map(function (item) {
      return (
        '<div class="achievement">' +
        '<p class="achievement__label">' +
        item.label +
        '</p>' +
        '<p class="achievement__value">' +
        item.value +
        '</p>' +
        '</div>'
      );
    }).join('');

    return (
      '<div class="tab-view">' +
      '<section class="section" aria-labelledby="myth-reality-heading">' +
      '<div class="section-head">' +
      '<h2 class="section-title" id="myth-reality-heading">Миф о «лёгком гении» и реальность труда</h2>' +
      '<span class="section-note">За воздушностью пушкинских строчек стоят десятки правок</span>' +
      '</div>' +
      '<div class="myth-grid">' +
      '<article class="myth-card">' +
      '<p class="myth-card__label">' +
      myth.label +
      '</p>' +
      '<h3>' +
      myth.title +
      '</h3>' +
      '<ul class="point-list">' +
      pointList(myth.points) +
      '</ul>' +
      '</article>' +
      '<article class="myth-card myth-card--reality">' +
      '<p class="myth-card__label">' +
      reality.label +
      '</p>' +
      '<h3>' +
      reality.title +
      '</h3>' +
      '<ul class="point-list point-list--ink">' +
      pointList(reality.points, 'point__dash--burgundy') +
      '</ul>' +
      '</article>' +
      '</div>' +
      '</section>' +

      '<section class="manuscript-section" aria-labelledby="manuscript-heading">' +
      '<div class="manuscript-media">' +
      figureSlot({
        src: 'images/pushkin-manuscript.jpg',
        alt: 'Черновик Пушкина с рисунками на полях',
        figureNumber: 'Илл. 04',
        title: 'Рукопись А. С. Пушкина',
        caption:
          'Страница черновика с многослойными правками строк и графическими набросками на полях.',
        aspect: '3x4',
        recommendedRatio: '3:4 · Рукопись',
      }) +
      '</div>' +
      '<div class="manuscript-content">' +
      '<div class="subsection-head">' +
      '<p class="eyebrow">Анатомия черновиков · 3 особенности работы поэта</p>' +
      '<h2 class="section-title" id="manuscript-heading">Что скрывают страницы рабочих тетрадей</h2>' +
      '</div>' +
      '<div class="fact-tabs" role="tablist" aria-label="Факты о черновиках Пушкина">' +
      factTabs +
      '</div>' +
      '<div class="fact-card">' +
      '<p class="fact-card__eyebrow">Факт ' +
      fact.marker +
      ' из 03</p>' +
      '<h3>' +
      fact.title +
      '</h3>' +
      '<p class="fact-card__description">' +
      fact.description +
      '</p>' +
      '<p class="fact-card__detail">' +
      fact.detail +
      '</p>' +
      '</div>' +
      '</div>' +
      '</section>' +

      '<section class="boldino" aria-labelledby="boldino-heading">' +
      '<div class="boldino__grid">' +
      '<div class="boldino__intro-block">' +
      '<p class="boldino__label">Осень 1830 года · 3 месяца уединения</p>' +
      '<h2 id="boldino-heading">Феномен Болдинской осени</h2>' +
      '<p class="boldino__intro">Из-за карантина по случаю эпидемии холеры Пушкин оказался заперт в родовом имении Болдино. Вынужденное уединение обернулось беспрецедентным творческим взлётом в истории русской литературы.</p>' +
      '</div>' +
      '<div class="boldino__achievements">' +
      achievements +
      '</div>' +
      '</div>' +
      '</section>' +

      '<section class="centered-quote" aria-label="Цитата из стихотворения Осень">' +
      '<p class="centered-quote__label">А. С. Пушкин · «Осень» (1833)</p>' +
      '<blockquote>И мысли в голове волнуются в отваге,<br>И рифмы лёгкие навстречу им бегут,<br>И пальцы просятся к перу, перо к бумаге,<br>Минута — и стихи свободно потекут.</blockquote>' +
      '</section>' +
      '</div>'
    );
  }

  /* ------------------------------------------------------------------------
     Раздел 05. После Пушкина
     ------------------------------------------------------------------------ */

  function renderModern() {
    var direction =
      D.XXI_CENTURY_DIRECTIONS.filter(function (d) {
        return d.id === state.directionId;
      })[0] || D.XXI_CENTURY_DIRECTIONS[0];

    var timeline = D.TIMELINE_XIX_XX.map(function (item) {
      return (
        '<article class="timeline-card">' +
        '<p class="timeline-card__period">' +
        item.period +
        '</p>' +
        '<h3>' +
        item.author +
        '</h3>' +
        '<p class="timeline-card__work">' +
        item.work +
        '</p>' +
        '<blockquote>' +
        item.quote +
        '</blockquote>' +
        '<p class="timeline-card__comment">' +
        item.comment +
        '</p>' +
        '</article>'
      );
    }).join('');

    var directionTabs = D.XXI_CENTURY_DIRECTIONS.map(function (dir, idx) {
      var selected = dir.id === state.directionId;
      return (
        '<button type="button" data-action="direction-select" data-id="' +
        dir.id +
        '" aria-pressed="' +
        (selected ? 'true' : 'false') +
        '" class="direction-tab' +
        (selected ? ' is-active' : '') +
        '">' +
        '<span class="direction-tab__hint">0' +
        (idx + 1) +
        '</span>' +
        '<span class="direction-tab__title">' +
        dir.title +
        '</span>' +
        '</button>'
      );
    }).join('');

    return (
      '<div class="tab-view">' +
      '<section class="section" aria-labelledby="timeline-heading">' +
      '<div class="section-head">' +
      '<h2 class="section-title" id="timeline-heading">Хронология XIX–XX веков: от гражданина к свидетелю эпохи</h2>' +
      '<span class="section-note">Четыре переломных этапа осмысления роли поэта</span>' +
      '</div>' +
      '<div class="timeline">' +
      timeline +
      '</div>' +
      '</section>' +

      '<section class="modern-section" aria-labelledby="xxi-heading">' +
      '<div class="modern-media">' +
      figureSlot({
        src: 'images/poetry-xx-xxi.jpg',
        alt: 'Поэзия XX-XXI веков',
        figureNumber: 'Илл. 05',
        title: 'Поэзия XX–XXI веков',
        caption:
          'От многотысячных вечеров поэтов-шестидесятников в Лужниках к современному звучанию поэтического слова.',
        aspect: '4x3',
        recommendedRatio: '4:3 · Фотография',
      }) +
      '</div>' +
      '<div class="modern-content">' +
      '<div class="subsection-head">' +
      '<p class="eyebrow">Современность · XXI век</p>' +
      '<h2 class="section-title" id="xxi-heading">Три направления современной поэзии</h2>' +
      '</div>' +
      '<div class="direction-tabs">' +
      directionTabs +
      '</div>' +
      '<div class="direction-card">' +
      '<p class="direction-card__eyebrow">' +
      direction.subtitle +
      '</p>' +
      '<h3>' +
      direction.title +
      '</h3>' +
      '<p class="direction-card__description">' +
      direction.description +
      '</p>' +
      '<div class="direction-card__continuation">' +
      '<p><strong>Связь с традицией:</strong> ' +
      direction.continuation +
      '</p>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</section>' +

      '<section class="conclusion" aria-labelledby="conclusion-heading">' +
      '<p class="conclusion__label">Финальный тезис проекта</p>' +
      '<h2 id="conclusion-heading">Меняются носители (гусиное перо → смартфон), но суть поэзии остаётся прежней</h2>' +
      '<p>Как и во времена Горация и Пушкина, подлинное поэтическое слово сохраняет внутреннюю свободу, бережёт живую память культуры и отвечает на главные вопросы человеческого сердца.</p>' +
      '</section>' +
      '</div>'
    );
  }

  /* ------------------------------------------------------------------------
     Раздел 06. Мини-игры
     ------------------------------------------------------------------------ */

  function renderInteractive() {
    var quizActive = state.mode === 'quiz';
    return (
      '<div class="tab-view tab-view--interactive">' +
      '<div class="game-switch">' +
      '<div class="game-switch__intro">' +
      '<h2>Выберите формат проверки для класса</h2>' +
      '<p>Мгновенная проверка ответов для работы с проектором, ноутбуком или смартфоном</p>' +
      '</div>' +
      '<div class="game-toggle" role="tablist" aria-label="Выбор мини-игры">' +
      '<button type="button" role="tab" aria-selected="' +
      (quizActive ? 'true' : 'false') +
      '" data-action="game-mode" data-mode="quiz" class="game-toggle__btn' +
      (quizActive ? ' is-active' : '') +
      '">Викторина (8 вопросов)</button>' +
      '<button type="button" role="tab" aria-selected="' +
      (!quizActive ? 'true' : 'false') +
      '" data-action="game-mode" data-mode="crossword" class="game-toggle__btn' +
      (!quizActive ? ' is-active' : '') +
      '">Кроссворд (10 слов)</button>' +
      '</div>' +
      '</div>' +
      (quizActive ? renderQuiz() : renderCrossword()) +
      '</div>'
    );
  }

  /* ---------------------------- Викторина -------------------------------- */

  function computeQuizSummary() {
    var questions = D.QUIZ_QUESTIONS;
    var answers = state.quiz.answers;
    var totalQuestions = questions.length;
    var answeredCount = 0;
    var correctCount = 0;

    questions.forEach(function (q) {
      var selected = answers[q.id];
      if (selected !== undefined) {
        answeredCount += 1;
        if (selected === q.correctIndex) correctCount += 1;
      }
    });

    var percentage =
      totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    var verdictTitle = 'Отличное знание темы';
    var verdictDescription =
      'Вы уверенно ориентируетесь в текстах А. С. Пушкина, истории его творчества и судьбе поэзии от Античности до XXI века.';

    if (percentage < 50) {
      verdictTitle = 'Стоит вернуться к разделам проекта';
      verdictDescription =
        'Обратите внимание на разбор стихотворений «Поэт» и «Поэт и толпа», хронологию ссылок и феномен Болдинской осени 1830 года.';
    } else if (percentage < 85) {
      verdictTitle = 'Хороший результат';
      verdictDescription =
        'Большинство фактов и цитат определены верно; отдельные детали можно освежить на вкладках проекта.';
    }

    return {
      answeredCount: answeredCount,
      correctCount: correctCount,
      totalQuestions: totalQuestions,
      percentage: percentage,
      verdictTitle: verdictTitle,
      verdictDescription: verdictDescription,
    };
  }

  function renderQuiz() {
    var questions = D.QUIZ_QUESTIONS;
    var quizState = state.quiz;
    var summary = computeQuizSummary();

    if (quizState.showSummary) {
      return (
        '<section class="quiz-summary" aria-labelledby="quiz-results-heading">' +
        '<p class="quiz-summary__label">Итоги викторины</p>' +
        '<h3 id="quiz-results-heading">' +
        summary.verdictTitle +
        '</h3>' +
        '<p class="quiz-summary__score">' +
        summary.correctCount +
        ' из ' +
        summary.totalQuestions +
        '</p>' +
        '<p class="quiz-summary__accuracy">Точность ответов: ' +
        summary.percentage +
        '%</p>' +
        '<p class="quiz-summary__description">' +
        summary.verdictDescription +
        '</p>' +
        '<div class="quiz-summary__actions">' +
        '<button type="button" data-action="quiz-review" class="btn-secondary">Просмотреть вопросы</button>' +
        '<button type="button" data-action="quiz-restart" class="btn-primary">' +
        icon('rotate') +
        '<span>Пройти заново</span>' +
        '</button>' +
        '</div>' +
        '</section>'
      );
    }

    var currentIdx = quizState.currentIdx;
    var currentQuestion = questions[currentIdx];
    var selectedOption = quizState.answers[currentQuestion.id];
    var isAnswered = selectedOption !== undefined;

    var nav = questions
      .map(function (q, idx) {
        var ans = quizState.answers[q.id];
        var answered = ans !== undefined;
        var correct = answered && ans === q.correctIndex;
        var cls = 'quiz-nav__btn';
        if (idx === currentIdx) cls += ' is-current';
        else if (answered) cls += correct ? ' is-correct' : ' is-wrong';
        return (
          '<button type="button" data-action="quiz-goto" data-index="' +
          idx +
          '" aria-label="Вопрос ' +
          (idx + 1) +
          '" class="' +
          cls +
          '">' +
          (idx + 1) +
          '</button>'
        );
      })
      .join('');

    var options = currentQuestion.options
      .map(function (option, idx) {
        var isSelected = selectedOption === idx;
        var isCorrectOption = idx === currentQuestion.correctIndex;
        var cls = 'quiz-option';
        var status = '';

        if (isAnswered) {
          if (isCorrectOption) {
            cls += ' is-correct';
            status =
              '<span class="quiz-option__status">' +
              icon('check', 'icon icon--xs') +
              '<span>Верно</span></span>';
          } else if (isSelected) {
            cls += ' is-wrong';
            status =
              '<span class="quiz-option__status">' +
              icon('close', 'icon icon--xs') +
              '<span>Ошибка</span></span>';
          } else {
            cls += ' is-dimmed';
          }
        }

        return (
          '<button type="button" data-action="quiz-answer" data-index="' +
          idx +
          '"' +
          (isAnswered ? ' disabled' : '') +
          ' class="' +
          cls +
          '">' +
          '<span class="quiz-option__text">' +
          option +
          '</span>' +
          status +
          '</button>'
        );
      })
      .join('');

    var quote = currentQuestion.quote
      ? '<blockquote class="quiz-quote">' +
        currentQuestion.quote.split(' / ').join('\n') +
        '</blockquote>'
      : '';

    var nextButton =
      currentIdx < questions.length - 1
        ? '<button type="button" data-action="quiz-next" class="btn-primary">Следующий вопрос</button>'
        : '<button type="button" data-action="quiz-show-summary" class="btn-primary">Показать итог</button>';

    var explanation = isAnswered
      ? '<div class="quiz-explain">' +
        '<p class="quiz-explain__text">' +
        (selectedOption === currentQuestion.correctIndex
          ? 'Верно! '
          : 'Неверно. ') +
        '<span>' +
        currentQuestion.explanation +
        '</span></p>' +
        nextButton +
        '</div>'
      : '';

    return (
      '<section class="quiz" aria-label="Викторина по литературе">' +
      '<div class="quiz-progress">' +
      '<div class="quiz-progress__main">' +
      '<strong>Вопрос ' +
      (currentIdx + 1) +
      ' из ' +
      questions.length +
      '</strong>' +
      '<span class="quiz-progress__dot" aria-hidden="true">·</span>' +
      '<span class="quiz-progress__category">' +
      currentQuestion.category +
      '</span>' +
      '</div>' +
      '<div class="quiz-progress__score">' +
      '<span>Верно: <strong>' +
      summary.correctCount +
      '</strong> / ' +
      summary.answeredCount +
      '</span>' +
      '<button type="button" data-action="quiz-reset" class="quiz-reset">' +
      icon('rotate', 'icon icon--xs') +
      '<span>Сбросить</span>' +
      '</button>' +
      '</div>' +
      '</div>' +

      '<div class="quiz-nav" aria-label="Номера вопросов">' +
      nav +
      '</div>' +

      '<div class="quiz-card">' +
      '<h3>' +
      currentQuestion.question +
      '</h3>' +
      quote +
      '<div class="quiz-options">' +
      options +
      '</div>' +
      explanation +
      '</div>' +
      '</section>'
    );
  }

  /* ---------------------------- Кроссворд --------------------------------- */

  function cellKey(row, col) {
    return row + ',' + col;
  }

  function buildCrosswordGrid() {
    var cells = new Map();

    D.CROSSWORD_WORDS.forEach(function (spec) {
      Array.from(spec.word).forEach(function (ch, idx) {
        var r = spec.direction === 'across' ? spec.row : spec.row + idx;
        var c = spec.direction === 'across' ? spec.col + idx : spec.col;
        var key = cellKey(r, c);
        var existing = cells.get(key);

        if (existing) {
          if (existing.expected !== ch) {
            throw new Error(
              'Crossword letter conflict at (' +
                r +
                ', ' +
                c +
                '): "' +
                existing.expected +
                '" vs "' +
                ch +
                '" for word ' +
                spec.word
            );
          }
          existing.wordIds.push(spec.id);
          if (idx === 0) existing.startNumbers.push(spec.id);
        } else {
          cells.set(key, {
            row: r,
            col: c,
            expected: ch,
            wordIds: [spec.id],
            startNumbers: idx === 0 ? [spec.id] : [],
          });
        }
      });
    });

    return cells;
  }

  function normalizeCyrillicLetter(raw) {
    var trimmed = String(raw).trim().toUpperCase();
    if (!trimmed) return '';
    var lastChar = trimmed.charAt(trimmed.length - 1);
    var normalized = lastChar === 'Ё' ? 'Е' : lastChar;
    return /^[А-Я]$/.test(normalized) ? normalized : '';
  }

  function getWordCells(spec) {
    return Array.from(spec.word).map(function (letter, idx) {
      var row = spec.direction === 'across' ? spec.row : spec.row + idx;
      var col = spec.direction === 'across' ? spec.col + idx : spec.col;
      return { row: row, col: col, key: cellKey(row, col), letter: letter };
    });
  }

  function wordById(id) {
    return D.CROSSWORD_WORDS.filter(function (w) {
      return w.id === id;
    })[0];
  }

  function activeWordSpec() {
    return wordById(cw.activeWordId) || D.CROSSWORD_WORDS[0];
  }

  function getSolvedWordIdsFor(entries) {
    return D.CROSSWORD_WORDS.filter(function (spec) {
      return getWordCells(spec).every(function (c) {
        return (entries[c.key] || '').toUpperCase() === c.letter;
      });
    }).map(function (w) {
      return w.id;
    });
  }

  function getSolvedWordIds() {
    return getSolvedWordIdsFor(cw.entries);
  }

  function getLockedCellKeysFor(entries, revealed) {
    var locked = new Set(revealed);
    var solvedIds = new Set(getSolvedWordIdsFor(entries));
    D.CROSSWORD_WORDS.forEach(function (spec) {
      if (!solvedIds.has(spec.id)) return;
      getWordCells(spec).forEach(function (c) {
        locked.add(c.key);
      });
    });
    return locked;
  }

  function getLockedCellKeys() {
    return getLockedCellKeysFor(cw.entries, cw.revealed);
  }

  function getNextEditableCellInWord(spec, row, col, step, lockedSet) {
    var cells = getWordCells(spec);
    var idx = cells.findIndex(function (c) {
      return c.row === row && c.col === col;
    });
    if (idx === -1) return null;

    var targetIdx = idx + step;
    while (targetIdx >= 0 && targetIdx < cells.length) {
      if (!lockedSet.has(cells[targetIdx].key)) {
        return { row: cells[targetIdx].row, col: cells[targetIdx].col };
      }
      targetIdx += step;
    }
    return null;
  }

  function getFirstEditableCellInWord(spec, lockedSet) {
    var cells = getWordCells(spec);
    var firstUnlocked = cells.filter(function (c) {
      return !lockedSet.has(c.key);
    })[0];
    var target = firstUnlocked || cells[0];
    return { row: target.row, col: target.col };
  }

  function findPreferredWordForCell(cell, preferredDirection) {
    var candidates = D.CROSSWORD_WORDS.filter(function (w) {
      return cell.wordIds.indexOf(w.id) !== -1;
    });
    return (
      candidates.filter(function (w) {
        return w.direction === preferredDirection;
      })[0] || candidates[0]
    );
  }

  function evaluateCrossword() {
    var cellStates = {};
    var correctCells = 0;

    grid.forEach(function (cell, key) {
      var val = (cw.entries[key] || '').toUpperCase();
      if (!val) {
        cellStates[key] = 'empty';
      } else if (val === cell.expected) {
        cellStates[key] = 'correct';
        correctCells += 1;
      } else {
        cellStates[key] = 'wrong';
      }
    });

    var solvedWordIds = [];
    var incorrectWordIds = [];
    var incompleteWordIds = [];

    D.CROSSWORD_WORDS.forEach(function (spec) {
      var wordCells = getWordCells(spec);
      var hasEmpty = wordCells.some(function (c) {
        return !(cw.entries[c.key] || '').trim();
      });
      if (hasEmpty) {
        incompleteWordIds.push(spec.id);
        return;
      }
      var allMatch = wordCells.every(function (c) {
        return (cw.entries[c.key] || '').toUpperCase() === c.letter;
      });
      if (allMatch) solvedWordIds.push(spec.id);
      else incorrectWordIds.push(spec.id);
    });

    return {
      solvedWordIds: solvedWordIds,
      incorrectWordIds: incorrectWordIds,
      incompleteWordIds: incompleteWordIds,
      correctCells: correctCells,
      totalCells: grid.size,
      cellStates: cellStates,
    };
  }

  var CONFETTI_PIECES = Array.from({ length: 34 }, function (_, idx) {
    var colors = ['#8B2635', '#9A7B4F', '#2D5A3F', '#1C1B18', '#C8B08A'];
    return {
      id: idx,
      leftPercent: (idx * 2.95 + 1.5) % 97,
      widthPx: idx % 3 === 0 ? 10 : 7,
      heightPx: idx % 2 === 0 ? 14 : 9,
      color: colors[idx % colors.length],
      delaySec: ((idx * 7) % 10) * 0.08,
      durationSec: 2.3 + ((idx * 5) % 7) * 0.22,
      driftPx: (idx % 2 === 0 ? 1 : -1) * (18 + (idx % 5) * 14),
    };
  });

  function launchConfetti() {
    clearConfetti();
    var overlay = document.createElement('div');
    overlay.className = 'confetti';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = CONFETTI_PIECES.map(function (piece) {
      return (
        '<span class="confetti__piece" style="left:' +
        piece.leftPercent +
        '%;width:' +
        piece.widthPx +
        'px;height:' +
        piece.heightPx +
        'px;background-color:' +
        piece.color +
        ';--confetti-delay:' +
        piece.delaySec +
        's;--confetti-duration:' +
        piece.durationSec +
        's;--confetti-drift:' +
        piece.driftPx +
        'px"></span>'
      );
    }).join('');
    document.body.appendChild(overlay);
    cw.confettiTimer = window.setTimeout(function () {
      overlay.remove();
      cw.confettiTimer = null;
    }, 3800);
  }

  function clearConfetti() {
    if (cw.confettiTimer) {
      window.clearTimeout(cw.confettiTimer);
      cw.confettiTimer = null;
    }
    var overlay = document.querySelector('.confetti');
    if (overlay) overlay.remove();
  }

  function renderCrossword() {
    var rows = [];
    for (var r = 0; r < D.CROSSWORD_ROWS; r += 1) {
      for (var c = 0; c < D.CROSSWORD_COLS; c += 1) {
        var key = cellKey(r, c);
        var cell = grid.get(key);
        if (!cell) {
          rows.push(
            '<div class="cw-cell cw-cell--empty" aria-hidden="true"></div>'
          );
          continue;
        }
        rows.push(
          '<div class="cw-cell" data-cell="' +
            key +
            '">' +
            (cell.startNumbers.length > 0
              ? '<span class="cw-cell__num" data-num="' +
                key +
                '" aria-hidden="true">' +
                cell.startNumbers[0] +
                '</span>'
              : '') +
            '<span class="cw-cell__dot" data-dot="' +
            key +
            '" aria-hidden="true" hidden></span>' +
            '<input type="text" inputmode="text" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" enterkeyhint="next" data-row="' +
            r +
            '" data-col="' +
            c +
            '" data-key="' +
            key +
            '" aria-label="Клетка строка ' +
            (r + 1) +
            ', столбец ' +
            (c + 1) +
            (cell.startNumbers.length > 0
              ? ', начало слова ' + cell.startNumbers[0]
              : '') +
            '" class="cw-input" value="">' +
            '</div>'
        );
      }
    }

    return (
      '<section class="crossword" aria-label="Интерактивный кроссворд">' +
      '<div id="cwVictory"></div>' +
      '<div class="cw-panel">' +
      '<div class="cw-panel__info">' +
      '<div class="cw-panel__meta">' +
      '<span class="cw-panel__question" id="cwQuestionMeta"></span>' +
      '<span class="cw-panel__solved" id="cwSolvedMeta"></span>' +
      '<span class="cw-panel__locked" id="cwLockedBadge" hidden>' +
      icon('lock', 'icon icon--xs') +
      '<span>Закреплено</span>' +
      '</span>' +
      '</div>' +
      '<p class="cw-panel__clue" id="cwClue"></p>' +
      '</div>' +
      '<div class="cw-panel__actions">' +
      '<button type="button" class="cw-mobile-keyboard" id="cwMobileKeyboard" data-action="cw-mobile-keyboard">' +
      icon('keyboard', 'icon icon--xs') +
      '<span>Ввести буквы</span>' +
      '</button>' +
      '<button type="button" class="btn-ghost" data-action="cw-reveal" id="cwReveal">Открыть букву</button>' +
      '<button type="button" class="btn-ghost btn-ghost--muted" data-action="cw-clear">Очистить</button>' +
      '<button type="button" class="btn-small-primary" data-action="cw-check">Проверить ответы</button>' +
      '</div>' +
      '</div>' +
      '<div id="cwNotice"></div>' +
      '<div id="cwEval"></div>' +
      '<div class="cw-layout">' +
      '<div class="cw-board-wrap">' +
      '<div class="cw-board" id="cwBoard">' +
      rows.join('') +
      '</div>' +
      '<p class="cw-board-note">Нажмите на клетку или вопрос для ввода · верно введённые слова закрепляются автоматически, а их буквы пропускаются при вводе</p>' +
      '</div>' +
      '<div class="cw-clues">' +
      '<div class="cw-clue-box">' +
      '<h3>По горизонтали</h3>' +
      '<ul class="cw-clue-list" id="cwAcross"></ul>' +
      '</div>' +
      '<div class="cw-clue-box">' +
      '<h3>По вертикали</h3>' +
      '<ul class="cw-clue-list" id="cwDown"></ul>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</section>'
    );
  }

  function initCrossword() {
    var board = document.getElementById('cwBoard');
    if (!board || board.dataset.bound === 'true') {
      updateCrosswordUI();
      return;
    }
    board.dataset.bound = 'true';

    board.addEventListener('focusin', function (e) {
      var input = e.target.closest('.cw-input');
      if (!input) return;
      cw.activeRow = Number(input.dataset.row);
      cw.activeCol = Number(input.dataset.col);
      updateCrosswordUI();
    });

    board.addEventListener('click', function (e) {
      var input = e.target.closest('.cw-input');
      if (!input) return;
      handleCellClick(Number(input.dataset.row), Number(input.dataset.col));
    });

    board.addEventListener('keydown', function (e) {
      var input = e.target.closest('.cw-input');
      if (!input) return;
      handleCellKeyDown(e, Number(input.dataset.row), Number(input.dataset.col));
    });

    board.addEventListener('beforeinput', function (e) {
      var input = e.target.closest('.cw-input');
      if (!input) return;
      handleCellBeforeInput(e, Number(input.dataset.row), Number(input.dataset.col));
    });

    board.addEventListener('input', function (e) {
      var input = e.target.closest('.cw-input');
      if (!input) return;
      handleCellChange(Number(input.dataset.row), Number(input.dataset.col), input.value);
    });

    updateCrosswordUI();
  }

  function focusCell(row, col) {
    cw.activeRow = row;
    cw.activeCol = col;
    var board = document.getElementById('cwBoard');
    if (!board) return;
    var input = board.querySelector(
      '.cw-input[data-key="' + cellKey(row, col) + '"]'
    );
    if (input) input.focus();
    updateCrosswordUI();
  }

  function commitEntriesUpdate(nextEntries, nextRevealed, wordForAdvance, fromRow, fromCol) {
    var prevSolvedSet = new Set(getSolvedWordIds());
    var nextSolvedIds = getSolvedWordIdsFor(nextEntries);
    var nextLockedKeys = getLockedCellKeysFor(nextEntries, nextRevealed);

    var newlySolved = nextSolvedIds
      .filter(function (id) {
        return !prevSolvedSet.has(id);
      })
      .map(wordById)
      .filter(Boolean);

    cw.entries = nextEntries;
    cw.revealed = nextRevealed;
    cw.evaluation = null;

    if (nextSolvedIds.length === D.CROSSWORD_WORDS.length) {
      cw.notice = null;
      if (prevSolvedSet.size < D.CROSSWORD_WORDS.length) {
        launchConfetti();
        var activeEl = document.activeElement;
        if (activeEl && activeEl.tagName === 'INPUT') activeEl.blur();
        updateCrosswordUI();
        window.requestAnimationFrame(function () {
          var victory = document.getElementById('cwVictory');
          if (victory) {
            victory.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
        return;
      }
      updateCrosswordUI();
      return;
    }

    if (newlySolved.length > 0) {
      var remaining = D.CROSSWORD_WORDS.length - nextSolvedIds.length;
      if (newlySolved.length === 1) {
        cw.notice =
          'Слово №' +
          newlySolved[0].id +
          ' «' +
          newlySolved[0].word +
          '» отгадано и закреплено! Осталось слов: ' +
          remaining +
          '.';
      } else {
        cw.notice =
          'Отгаданы и закреплены слова: ' +
          newlySolved
            .map(function (w) {
              return '«' + w.word + '»';
            })
            .join(', ') +
          '! Осталось слов: ' +
          remaining +
          '.';
      }
    }

    updateCrosswordUI();

    var nextEditable = getNextEditableCellInWord(
      wordForAdvance,
      fromRow,
      fromCol,
      1,
      nextLockedKeys
    );
    if (nextEditable) focusCell(nextEditable.row, nextEditable.col);
  }

  function applyLetterToCell(row, col, letter) {
    var key = cellKey(row, col);
    var cell = grid.get(key);
    if (!cell) return;

    var lockedKeys = getLockedCellKeys();

    if (lockedKeys.has(key)) {
      var nextEditable = getNextEditableCellInWord(
        activeWordSpec(),
        row,
        col,
        1,
        lockedKeys
      );
      if (!nextEditable) return;

      if (letter === cell.expected) {
        focusCell(nextEditable.row, nextEditable.col);
        return;
      }

      var nextKey = cellKey(nextEditable.row, nextEditable.col);
      var entries = Object.assign({}, cw.entries);
      entries[nextKey] = letter;
      commitEntriesUpdate(
        entries,
        cw.revealed,
        activeWordSpec(),
        nextEditable.row,
        nextEditable.col
      );
      return;
    }

    var nextEntries = Object.assign({}, cw.entries);
    nextEntries[key] = letter;
    commitEntriesUpdate(nextEntries, cw.revealed, activeWordSpec(), row, col);
  }

  function handleBackspaceAt(row, col) {
    var key = cellKey(row, col);
    var lockedKeys = getLockedCellKeys();
    var isLocked = lockedKeys.has(key);

    if (!isLocked && (cw.entries[key] || '') !== '') {
      var next = Object.assign({}, cw.entries);
      delete next[key];
      cw.entries = next;
      cw.evaluation = null;
      updateCrosswordUI();
      return;
    }

    var prevEditable = getNextEditableCellInWord(
      activeWordSpec(),
      row,
      col,
      -1,
      lockedKeys
    );
    if (prevEditable) {
      var prevKey = cellKey(prevEditable.row, prevEditable.col);
      var entries = Object.assign({}, cw.entries);
      delete entries[prevKey];
      cw.entries = entries;
      cw.evaluation = null;
      updateCrosswordUI();
      focusCell(prevEditable.row, prevEditable.col);
    }
  }

  function handleCellClick(row, col) {
    var key = cellKey(row, col);
    var cell = grid.get(key);
    if (!cell) return;

    var solvedIds = new Set(getSolvedWordIds());
    var isSameCell = cw.activeRow === row && cw.activeCol === col;
    var nextWordId = cw.activeWordId;

    if (isSameCell && cell.wordIds.length > 1) {
      nextWordId =
        cell.wordIds.filter(function (id) {
          return id !== cw.activeWordId;
        })[0] || cell.wordIds[0];
    } else if (cell.wordIds.indexOf(cw.activeWordId) === -1) {
      var unsolvedCandidate = cell.wordIds.filter(function (id) {
        return !solvedIds.has(id);
      })[0];
      if (unsolvedCandidate !== undefined) {
        nextWordId = unsolvedCandidate;
      } else {
        var chosen = findPreferredWordForCell(
          cell,
          activeWordSpec().direction
        );
        if (chosen) nextWordId = chosen.id;
      }
    } else if (solvedIds.has(cw.activeWordId) && cell.wordIds.length > 1) {
      var otherUnsolved = cell.wordIds.filter(function (id) {
        return id !== cw.activeWordId && !solvedIds.has(id);
      })[0];
      if (otherUnsolved !== undefined) nextWordId = otherUnsolved;
    }

    cw.activeWordId = nextWordId;
    focusCell(row, col);
  }

  function handleSelectWordFromClue(wordId) {
    var spec = wordById(wordId);
    if (!spec) return;
    cw.activeWordId = wordId;
    var firstEditable = getFirstEditableCellInWord(spec, getLockedCellKeys());
    focusCell(firstEditable.row, firstEditable.col);
  }

  function handleOpenMobileKeyboard() {
    var key = cellKey(cw.activeRow, cw.activeCol);
    var word = activeWordSpec();
    var wordKeys = new Set(
      getWordCells(word).map(function (c) {
        return c.key;
      })
    );
    var lockedKeys = getLockedCellKeys();

    if (!lockedKeys.has(key) && wordKeys.has(key)) {
      focusCell(cw.activeRow, cw.activeCol);
      return;
    }
    var target = getFirstEditableCellInWord(word, lockedKeys);
    focusCell(target.row, target.col);
  }

  function handleCellChange(row, col, rawValue) {
    var key = cellKey(row, col);
    var lockedKeys = getLockedCellKeys();

    if (lockedKeys.has(key)) {
      if (rawValue) {
        var lockedLetter = normalizeCyrillicLetter(rawValue);
        if (lockedLetter) {
          applyLetterToCell(row, col, lockedLetter);
          return;
        }
      }
      restoreInputValue(key, row, col);
      return;
    }

    if (rawValue === '') {
      var next = Object.assign({}, cw.entries);
      delete next[key];
      cw.entries = next;
      cw.evaluation = null;
      updateCrosswordUI();
      return;
    }

    var letter = normalizeCyrillicLetter(rawValue);
    if (!letter) {
      restoreInputValue(key, row, col);
      return;
    }
    applyLetterToCell(row, col, letter);
  }

  function restoreInputValue(key, row, col) {
    var board = document.getElementById('cwBoard');
    if (!board) return;
    var input = board.querySelector(
      '.cw-input[data-key="' + key + '"]'
    );
    if (input) input.value = cw.entries[key] || '';
    if (cw.activeRow === row && cw.activeCol === col) updateCrosswordUI();
  }

  function handleCellKeyDown(e, row, col) {
    if (e.nativeEvent && e.nativeEvent.isComposing) return;
    if (e.isComposing || e.key === 'Unidentified' || e.key === 'Process') {
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      handleBackspaceAt(row, col);
      return;
    }

    var letter =
      !e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1
        ? normalizeCyrillicLetter(e.key)
        : '';
    if (letter) {
      e.preventDefault();
      applyLetterToCell(row, col, letter);
      return;
    }

    var deltas = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };

    var delta = deltas[e.key];
    if (delta) {
      e.preventDefault();
      e.stopPropagation();
      var nr = row + delta[0];
      var nc = col + delta[1];
      while (
        nr >= 0 &&
        nr < D.CROSSWORD_ROWS &&
        nc >= 0 &&
        nc < D.CROSSWORD_COLS
      ) {
        var target = grid.get(cellKey(nr, nc));
        if (target) {
          if (target.wordIds.indexOf(cw.activeWordId) === -1) {
            var dir = delta[0] !== 0 ? 'down' : 'across';
            var chosen = findPreferredWordForCell(target, dir);
            if (chosen) cw.activeWordId = chosen.id;
          }
          focusCell(nr, nc);
          break;
        }
        nr += delta[0];
        nc += delta[1];
      }
    }
  }

  function handleCellBeforeInput(e, row, col) {
    var native = e;
    if (!native) return;

    if (native.inputType === 'deleteContentBackward') {
      e.preventDefault();
      handleBackspaceAt(row, col);
      return;
    }

    if (native.inputType !== 'insertText') return;

    var data = native.data || '';
    var letter = normalizeCyrillicLetter(data);
    if (!letter) return;

    e.preventDefault();
    applyLetterToCell(row, col, letter);
  }

  function handleRevealCell() {
    var lockedKeys = getLockedCellKeys();
    var targetRow = cw.activeRow;
    var targetCol = cw.activeCol;
    var targetKey = cellKey(targetRow, targetCol);

    if (lockedKeys.has(targetKey)) {
      var first = getFirstEditableCellInWord(activeWordSpec(), lockedKeys);
      targetRow = first.row;
      targetCol = first.col;
      targetKey = cellKey(targetRow, targetCol);
    }

    var cell = grid.get(targetKey);
    if (!cell || lockedKeys.has(targetKey)) return;

    var nextRevealed = new Set(cw.revealed);
    nextRevealed.add(targetKey);

    var nextEntries = Object.assign({}, cw.entries);
    nextEntries[targetKey] = cell.expected;

    commitEntriesUpdate(
      nextEntries,
      nextRevealed,
      activeWordSpec(),
      targetRow,
      targetCol
    );
  }

  function handleClearCrossword() {
    cw.entries = {};
    cw.revealed = new Set();
    cw.evaluation = null;
    cw.notice = null;
    cw.activeWordId = 1;
    cw.activeRow = 0;
    cw.activeCol = 2;
    clearConfetti();
    updateCrosswordUI();
  }

  function handleCheckCrossword() {
    cw.evaluation = evaluateCrossword();
    updateCrosswordUI();
  }

  function updateCrosswordUI() {
    var board = document.getElementById('cwBoard');
    if (!board) return;

    var solvedIds = getSolvedWordIds();
    var solvedSet = new Set(solvedIds);
    var lockedKeys = getLockedCellKeys();
    var word = activeWordSpec();
    var evaluation = cw.evaluation;

    var activeWordKeys = new Set(
      getWordCells(word).map(function (c) {
        return c.key;
      })
    );

    var allSolved = solvedIds.length === D.CROSSWORD_WORDS.length;

    grid.forEach(function (cell, key) {
      var input = board.querySelector('.cw-input[data-key="' + key + '"]');
      if (!input) return;

      var value = cw.entries[key] || '';
      if (input.value !== value) input.value = value;

      var isFocused = cw.activeRow === cell.row && cw.activeCol === cell.col;
      var isInActiveWord = activeWordKeys.has(key);
      var isLocked = lockedKeys.has(key);
      var cellEval = evaluation ? evaluation.cellStates[key] : undefined;

      var cls = 'cw-input';
      if (isInActiveWord) cls += ' is-in-word';
      if (isLocked) cls += ' is-locked';
      else if (cellEval === 'correct') cls += ' is-correct';
      else if (cellEval === 'wrong') cls += ' is-wrong';
      if (isFocused) cls += ' is-focused';

      if (input.className !== cls) input.className = cls;
      input.setAttribute('data-locked', isLocked ? 'true' : 'false');

      var label =
        'Клетка строка ' +
        (cell.row + 1) +
        ', столбец ' +
        (cell.col + 1) +
        (cell.startNumbers.length > 0
          ? ', начало слова ' + cell.startNumbers[0]
          : '') +
        (isLocked ? ', закреплено' : '');
      if (input.getAttribute('aria-label') !== label) {
        input.setAttribute('aria-label', label);
      }

      var num = board.querySelector('.cw-cell__num[data-num="' + key + '"]');
      if (num) {
        num.className =
          'cw-cell__num' + (isLocked ? ' cw-cell__num--locked' : '');
      }

      var dot = board.querySelector('.cw-cell__dot[data-dot="' + key + '"]');
      if (dot) {
        if (!isLocked && cellEval === 'wrong') dot.removeAttribute('hidden');
        else dot.setAttribute('hidden', '');
      }
    });

    var questionMeta = document.getElementById('cwQuestionMeta');
    if (questionMeta) {
      questionMeta.textContent =
        'Вопрос №' +
        word.id +
        ' · ' +
        (word.direction === 'across' ? 'По горизонтали' : 'По вертикали') +
        ' · ' +
        word.word.length +
        ' букв';
    }

    var solvedMeta = document.getElementById('cwSolvedMeta');
    if (solvedMeta) {
      solvedMeta.textContent =
        'Отгадано: ' + solvedIds.length + ' / ' + D.CROSSWORD_WORDS.length;
    }

    var lockedBadge = document.getElementById('cwLockedBadge');
    if (lockedBadge) {
      if (solvedSet.has(word.id)) lockedBadge.removeAttribute('hidden');
      else lockedBadge.setAttribute('hidden', '');
    }

    var clueEl = document.getElementById('cwClue');
    if (clueEl) clueEl.textContent = word.clue;

    var mobileKeyboard = document.getElementById('cwMobileKeyboard');
    if (mobileKeyboard) {
      if (allSolved) mobileKeyboard.setAttribute('hidden', '');
      else mobileKeyboard.removeAttribute('hidden');
    }

    var revealButton = document.getElementById('cwReveal');
    if (revealButton) revealButton.disabled = allSolved;

    var victory = document.getElementById('cwVictory');
    if (victory) {
      if (allSolved) {
        victory.innerHTML =
          '<div class="cw-victory" role="status" aria-live="polite">' +
          '<div class="cw-victory__inner">' +
          '<div class="cw-victory__body">' +
          '<p class="cw-victory__status">' +
          icon('award', 'icon icon--xs') +
          '<span>Кроссворд полностью разгадан</span>' +
          '</p>' +
          '<h3>Браво! Все 10 слов закреплены</h3>' +
          '<p class="cw-victory__stats">Отгадано слов: <strong>10 из 10</strong> · Букв в сетке: <strong>' +
          grid.size +
          ' из ' +
          grid.size +
          '</strong></p>' +
          '<p class="cw-victory__quote">«И долго буду тем любезен я народу, что чувства добрые я лирой пробуждал…»</p>' +
          '</div>' +
          '<button type="button" class="btn-primary" data-action="cw-clear">' +
          icon('rotate') +
          '<span>Сыграть ещё раз</span>' +
          '</button>' +
          '</div>' +
          '</div>';
      } else {
        victory.innerHTML = '';
      }
    }

    var notice = document.getElementById('cwNotice');
    if (notice) {
      if (!allSolved && cw.notice) {
        notice.innerHTML =
          '<div class="cw-notice" role="status" aria-live="polite">' +
          icon('lock', 'icon icon--xs') +
          '<span>' +
          cw.notice +
          '</span></div>';
      } else {
        notice.innerHTML = '';
      }
    }

    var evalBox = document.getElementById('cwEval');
    if (evalBox) {
      if (evaluation && !allSolved) {
        evalBox.innerHTML =
          '<div class="cw-eval" role="status">' +
          '<p class="cw-eval__count">Верных слов: ' +
          evaluation.solvedWordIds.length +
          ' из ' +
          D.CROSSWORD_WORDS.length +
          ' · Правильных букв: ' +
          evaluation.correctCells +
          ' из ' +
          evaluation.totalCells +
          '</p>' +
          '<p class="cw-eval__note">Бордовая точка — ошибка, зелёные клетки закреплены и пропускаются при вводе</p>' +
          '</div>';
      } else {
        evalBox.innerHTML = '';
      }
    }

    renderClueList('cwAcross', 'across', solvedSet, evaluation);
    renderClueList('cwDown', 'down', solvedSet, evaluation);
  }

  function renderClueList(containerId, direction, solvedSet, evaluation) {
    var list = document.getElementById(containerId);
    if (!list) return;

    list.innerHTML = D.CROSSWORD_WORDS.filter(function (w) {
      return w.direction === direction;
    })
      .map(function (w) {
        var isActive = w.id === cw.activeWordId;
        var isSolved = solvedSet.has(w.id);
        var isWrong =
          !isSolved &&
          evaluation &&
          evaluation.incorrectWordIds.indexOf(w.id) !== -1;

        var cls = 'cw-clue';
        if (isSolved) cls += ' is-solved';
        if (isActive) cls += ' is-active';

        return (
          '<li>' +
          '<button type="button" data-action="cw-select-word" data-word="' +
          w.id +
          '" class="' +
          cls +
          '">' +
          '<span class="cw-clue__text' +
          (isSolved ? ' is-solved' : '') +
          '"><strong class="cw-clue__num">' +
          w.id +
          '.</strong> ' +
          w.clue +
          ' <span class="cw-clue__length">(' +
          w.word.length +
          ')</span></span>' +
          (isSolved
            ? '<span class="cw-clue__mark" aria-label="Слово отгадано и закреплено">' +
              icon('check', 'icon icon--xs') +
              '</span>'
            : '') +
          (isWrong ? '<span class="cw-clue__cross">×</span>' : '') +
          '</button>' +
          '</li>'
        );
      })
      .join('');
  }

  /* ------------------------------------------------------------------------
     Делегирование кликов внутри раздела
     ------------------------------------------------------------------------ */

  tabPanel.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-action]');
    if (!trigger || !tabPanel.contains(trigger)) return;
    var action = trigger.dataset.action;

    if (action === 'poet-state') {
      state.poetState = trigger.dataset.state === 'inspired' ? 'inspired' : 'ordinary';
      rerenderTab();
    } else if (action === 'dialogue-select') {
      state.dialogueIndex = Number(trigger.dataset.index) || 0;
      rerenderTab();
    } else if (action === 'freedom-step') {
      state.freedomStep = Number(trigger.dataset.step) || 1;
      rerenderTab();
    } else if (action === 'fact-select') {
      state.factId = trigger.dataset.id || D.MANUSCRIPT_FACTS[0].id;
      rerenderTab();
    } else if (action === 'direction-select') {
      state.directionId = trigger.dataset.id || D.XXI_CENTURY_DIRECTIONS[0].id;
      rerenderTab();
    } else if (action === 'game-mode') {
      var mode = trigger.dataset.mode === 'crossword' ? 'crossword' : 'quiz';
      if (mode !== state.mode) {
        state.mode = mode;
        if (mode === 'quiz') {
          resetQuizState();
        } else {
          resetCrosswordState();
        }
        rerenderTab();
      }
    } else if (action === 'quiz-answer') {
      var question = D.QUIZ_QUESTIONS[state.quiz.currentIdx];
      if (state.quiz.answers[question.id] !== undefined) return;
      state.quiz.answers[question.id] = Number(trigger.dataset.index);
      rerenderTab();
    } else if (action === 'quiz-goto') {
      state.quiz.currentIdx = Number(trigger.dataset.index) || 0;
      rerenderTab();
    } else if (action === 'quiz-next') {
      if (state.quiz.currentIdx < D.QUIZ_QUESTIONS.length - 1) {
        state.quiz.currentIdx += 1;
        rerenderTab();
      }
    } else if (action === 'quiz-show-summary') {
      state.quiz.showSummary = true;
      rerenderTab();
    } else if (action === 'quiz-review') {
      state.quiz.showSummary = false;
      rerenderTab();
    } else if (action === 'quiz-reset' || action === 'quiz-restart') {
      resetQuizState();
      rerenderTab();
    } else if (action === 'cw-select-word') {
      handleSelectWordFromClue(Number(trigger.dataset.word));
    } else if (action === 'cw-reveal') {
      handleRevealCell();
    } else if (action === 'cw-check') {
      handleCheckCrossword();
    } else if (action === 'cw-clear') {
      handleClearCrossword();
    } else if (action === 'cw-mobile-keyboard') {
      handleOpenMobileKeyboard();
    }
  });

  /* ------------------------------------------------------------------------
     Шапка и подвал: обработчики
     ------------------------------------------------------------------------ */

  function handleTabButtonClick(e) {
    var trigger = e.target.closest('[data-tab-id]');
    if (!trigger) return;
    selectTab(trigger.dataset.tabId);
  }

  mainNav.addEventListener('click', handleTabButtonClick);
  mobileMenuGrid.addEventListener('click', handleTabButtonClick);

  brandButton.addEventListener('click', function () {
    selectTab('origins');
  });

  menuButton.addEventListener('click', function () {
    setMenuOpen(!state.menuOpen);
  });

  prevButton.addEventListener('click', function () {
    var idx = activeIndex();
    if (idx > 0) selectTab(D.PROJECT_TABS[idx - 1].id);
  });

  nextButton.addEventListener('click', function () {
    var idx = activeIndex();
    if (idx < D.PROJECT_TABS.length - 1) {
      selectTab(D.PROJECT_TABS[idx + 1].id);
    }
  });

  /* Глобальные стрелки ← / →, как в React-версии */
  window.addEventListener('keydown', function (e) {
    var target = e.target;
    var tag = target && target.tagName ? target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    var idx = activeIndex();
    if (e.key === 'ArrowRight' && idx < D.PROJECT_TABS.length - 1) {
      selectTab(D.PROJECT_TABS[idx + 1].id);
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      selectTab(D.PROJECT_TABS[idx - 1].id);
    }
  });

  /* ------------------------------------------------------------------------
     Старт
     ------------------------------------------------------------------------ */

  renderHeader();
  renderPageHeader();
  renderTab({ animate: true });
  renderFooter();
})();
