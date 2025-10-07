/**
 * "Умный" Менеджер Настроек для макросов (на основе Журнала).
 *
 * ВЕРСИЯ 3.2
 * - ИЗМЕНЕНО: Все настройки отображаются на одной форме и сохраняются разом
 * - УДАЛЕНО: Кнопки с отдельными диалогами
 */

// --- КОНФИГУРАЦИЯ ---
const SETTINGS_JOURNAL_NAME = "Настройки Макросов";

// Конфигурация для FPManager
const FP_MANAGER_CONFIG = {
  name: "FPManager",
  label: "Менеджер Фейт Поинтов",
  settings: {
    fatePointImage: {
      label: "Изображение для Fate Points",
      type: "image",
      default: "",
    },
    player1X: {
      label: "Player 1 - X координата",
      type: "number",
      default: 1185,
    },
    player1Y: {
      label: "Player 1 - Y координата",
      type: "number",
      default: 708,
    },
    player2X: {
      label: "Player 2 - X координата",
      type: "number",
      default: 2145,
    },
    player2Y: {
      label: "Player 2 - Y координата",
      type: "number",
      default: 740,
    },
    player3X: {
      label: "Player 3 - X координата",
      type: "number",
      default: 3095,
    },
    player3Y: {
      label: "Player 3 - Y координата",
      type: "number",
      default: 695,
    },
    gmX: {
      label: "Мастер - X координата",
      type: "number",
      default: 3000,
    },
    gmY: {
      label: "Мастер - Y координата",
      type: "number",
      default: 2220,
    },
    stepX: {
      label: "Отступ жетонов по X",
      type: "number",
      default: 20,
    },
    stepY: {
      label: "Отступ жетонов по Y",
      type: "number",
      default: 20,
    },
    tileWidth: {
      label: "Ширина жетона",
      type: "number",
      default: 70,
    },
    tileHeight: {
      label: "Высота жетона",
      type: "number",
      default: 70,
    }
  }
};

// Конфигурация для SitAspectManager
const SIT_ASPECT_CONFIG = {
  name: "SitAspectManager",
  label: "Менеджер Ситуативных Аспектов",
  settings: {
    widgetPositionX: {
      label: "Виджет - X координата",
      type: "number",
      default: 960,
    },
    widgetPositionY: {
      label: "Виджет - Y координата",
      type: "number",
      default: 1415,
    },
    widgetWidth: {
      label: "Виджет - Ширина",
      type: "number",
      default: 500,
    },
    widgetHeight: {
      label: "Виджет - Высота",
      type: "number",
      default: 800,
    },
    widgetFontFamily: {
      label: "Виджет - Семейство шрифта",
      type: "text",
      default: "BadScript",
    },
    widgetFontSize: {
      label: "Виджет - Размер шрифта",
      type: "number",
      default: 32,
    }
  }
};

const PLAYER_WIDGET_CONFIG = {
  name: "PlayerWidgetManager",
  label: "Настройки Виджетов Игроков",
  settings: {
    // Размеры элементов
    portraitSizeWidth: {
      label: "Ширина портрета",
      type: "number",
      default: 270,
    },
    portraitSizeHeight: {
      label: "Высота портрета",
      type: "number",
      default: 270,
    },
    nameSizeWidth: {
      label: "Ширина имени",
      type: "number",
      default: 460,
    },
    nameSizeHeight: {
      label: "Высота имени",
      type: "number",
      default: 40,
    },
    nameFontSize: {
      label: "Размер шрифта имени",
      type: "number",
      default: 26,
    },
    aspectsSizeWidth: {
      label: "Ширина аспектов",
      type: "number",
      default: 275,
    },
    aspectsSizeHeight: {
      label: "Высота аспектов",
      type: "number",
      default: 450,
    },
    aspectsFontSize: {
      label: "Размер шрифта аспектов",
      type: "number",
      default: 20,
    },
    fontFamily: {
      label: "Семейство шрифта",
      type: "text",
      default: "Montserrat",
    },

    // Настройки навыков
    skillNameSizeWidth: {
      label: "Ширина названия навыка",
      type: "number",
      default: 350,
    },
    skillNameSizeHeight: {
      label: "Высота названия навыка",
      type: "number",
      default: 50,
    },
    skillNameFont: {
      label: "Шрифт названия навыка",
      type: "text",
      default: "Montserrat",
    },
    skillNameFontSize: {
      label: "Размер шрифта названия навыка",
      type: "number",
      default: 16,
    },
    skillValueSizeWidth: {
      label: "Ширина значения навыка",
      type: "number",
      default: 50,
    },
    skillValueSizeHeight: {
      label: "Высота значения навыка",
      type: "number",
      default: 50,
    },
    skillValueFont: {
      label: "Шрифт значения навыка",
      type: "text",
      default: "Bruno Ace",
    },
    skillValueFontSize: {
      label: "Размер шрифта значения навыка",
      type: "number",
      default: 30,
    },

    // Настройки стресса
    stressBoxSizeWidth: {
      label: "Ширина бокса стресса",
      type: "number",
      default: 35,
    },
    stressBoxSizeHeight: {
      label: "Высота бокса стресса",
      type: "number",
      default: 35,
    },
    stressSpacingX: {
      label: "Отступ между боксами стресса",
      type: "number",
      default: 40,
    },
    stressFontFamily: {
      label: "Шрифт стресса",
      type: "text",
      default: "Bruno Ace",
    },
    stressFontSize: {
      label: "Размер шрифта стресса",
      type: "number",
      default: 24,
    },
    stressLineWidth: {
      label: "Толщина линии стресса",
      type: "number",
      default: 4,
    },

    // Позиции для Игрока 1
    player1PortraitX: {
      label: "Игрок 1 - Портрет X",
      type: "number",
      default: 880,
    },
    player1PortraitY: {
      label: "Игрок 1 - Портрет Y",
      type: "number",
      default: 645,
    },
    player1NameX: {
      label: "Игрок 1 - Имя X",
      type: "number",
      default: 1150,
    },
    player1NameY: {
      label: "Игрок 1 - Имя Y",
      type: "number",
      default: 630,
    },
    player1AspectsX: {
      label: "Игрок 1 - Аспекты X",
      type: "number",
      default: 1310,
    },
    player1AspectsY: {
      label: "Игрок 1 - Аспекты Y",
      type: "number",
      default: 710,
    },
    player1StressStartX: {
      label: "Игрок 1 - Стресс начало X",
      type: "number",
      default: 890,
    },
    player1StressStartY: {
      label: "Игрок 1 - Стресс начало Y",
      type: "number",
      default: 940,
    },
    player1SkillNameX: {
      label: "Игрок 1 - Навыки имя X",
      type: "number",
      default: 871,
    },
    player1SkillNameY: {
      label: "Игрок 1 - Навыки имя Y",
      type: "number",
      default: 986,
    },
    player1SkillValueX: {
      label: "Игрок 1 - Навыки значение X",
      type: "number",
      default: 1219,
    },
    player1SkillValueY: {
      label: "Игрок 1 - Навыки значение Y",
      type: "number",
      default: 986,
    },

    // Позиции для Игрока 2
    player2PortraitX: {
      label: "Игрок 2 - Портрет X",
      type: "number",
      default: 1840,
    },
    player2PortraitY: {
      label: "Игрок 2 - Портрет Y",
      type: "number",
      default: 680,
    },
    player2NameX: {
      label: "Игрок 2 - Имя X",
      type: "number",
      default: 2110,
    },
    player2NameY: {
      label: "Игрок 2 - Имя Y",
      type: "number",
      default: 663,
    },
    player2AspectsX: {
      label: "Игрок 2 - Аспекты X",
      type: "number",
      default: 2270,
    },
    player2AspectsY: {
      label: "Игрок 2 - Аспекты Y",
      type: "number",
      default: 745,
    },
    player2StressStartX: {
      label: "Игрок 2 - Стресс начало X",
      type: "number",
      default: 1850,
    },
    player2StressStartY: {
      label: "Игрок 2 - Стресс начало Y",
      type: "number",
      default: 970,
    },
    player2SkillNameX: {
      label: "Игрок 2 - Навыки имя X",
      type: "number",
      default: 1830,
    },
    player2SkillNameY: {
      label: "Игрок 2 - Навыки имя Y",
      type: "number",
      default: 1020,
    },
    player2SkillValueX: {
      label: "Игрок 2 - Навыки значение X",
      type: "number",
      default: 2178,
    },
    player2SkillValueY: {
      label: "Игрок 2 - Навыки значение Y",
      type: "number",
      default: 1020,
    },

    // Позиции для Игрока 3
    player3PortraitX: {
      label: "Игрок 3 - Портрет X",
      type: "number",
      default: 2790,
    },
    player3PortraitY: {
      label: "Игрок 3 - Портрет Y",
      type: "number",
      default: 635,
    },
    player3NameX: {
      label: "Игрок 3 - Имя X",
      type: "number",
      default: 3060,
    },
    player3NameY: {
      label: "Игрок 3 - Имя Y",
      type: "number",
      default: 620,
    },
    player3AspectsX: {
      label: "Игрок 3 - Аспекты X",
      type: "number",
      default: 3220,
    },
    player3AspectsY: {
      label: "Игрок 3 - Аспекты Y",
      type: "number",
      default: 700,
    },
    player3StressStartX: {
      label: "Игрок 3 - Стресс начало X",
      type: "number",
      default: 2802,
    },
    player3StressStartY: {
      label: "Игрок 3 - Стресс начало Y",
      type: "number",
      default: 927,
    },
    player3SkillNameX: {
      label: "Игрок 3 - Навыки имя X",
      type: "number",
      default: 2780,
    },
    player3SkillNameY: {
      label: "Игрок 3 - Навыки имя Y",
      type: "number",
      default: 975,
    },
    player3SkillValueX: {
      label: "Игрок 3 - Навыки значение X",
      type: "number",
      default: 3128,
    },
    player3SkillValueY: {
      label: "Игрок 3 - Навыки значение Y",
      type: "number",
      default: 975,
    },
  }
};

const CHALLENGE_CONTEST_CONFIG = {
  name: "ChallengeContestManager",
  label: "Менеджер Вызовов и Состязаний",
  settings: {
    // Challenge settings
    challengeFontFamily: {
      label: "Шрифт для вызовов",
      type: "text",
      default: "Montserrat",
    },
    challengeFontSize: {
      label: "Размер шрифта для вызовов",
      type: "number",
      default: 40,
    },
    challengeAddBackground: {
      label: "Добавлять фон для вызовов",
      type: "text",
      default: "false",
    },
    challengeBackgroundColor: {
      label: "Цвет фона для вызовов",
      type: "text",
      default: "#ffffff",
    },

    // Contest settings
    contestFontFamily: {
      label: "Шрифт для состязаний",
      type: "text",
      default: "Montserrat",
    },
    contestFontSize: {
      label: "Размер шрифта для состязаний",
      type: "number",
      default: 40,
    },
    contestAddBackground: {
      label: "Добавлять фон для состязаний",
      type: "text",
      default: "false",
    },
    contestBackgroundColor: {
      label: "Цвет фона для состязаний",
      type: "text",
      default: "#ffffff",
    },
  }
};

const MODULES_CONFIG = [FP_MANAGER_CONFIG, SIT_ASPECT_CONFIG, PLAYER_WIDGET_CONFIG, CHALLENGE_CONTEST_CONFIG];

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

/**
 * Находит или создает Запись в Журнале и возвращает ее.
 * @returns {Promise<JournalEntry>}
 */
const getSettingsJournal = async () => {
  let journal = game.journal.getName(SETTINGS_JOURNAL_NAME);
  if (!journal) {
    ui.notifications.info(`Создание журнала настроек "${SETTINGS_JOURNAL_NAME}"...`);
    journal = await JournalEntry.create({
      name: SETTINGS_JOURNAL_NAME,
      pages: [],
    });
  }
  return journal;
};

/**
 * Создает страницу настроек для модуля, если она не существует.
 * @param {JournalEntry} journal - Журнал настроек
 * @param {object} moduleConfig - Конфигурация модуля
 * @returns {Promise<object>} - Текущие настройки модуля
 */
const getOrCreateModuleSettingsPage = async (journal, moduleConfig) => {
  const pageName = moduleConfig.name;
  let page = journal.pages.getName(pageName);

  if (!page) {
    // Создаем страницу с настройками по умолчанию
    const defaultSettings = {};
    for (const [key, setting] of Object.entries(moduleConfig.settings)) {
      defaultSettings[key] = setting.default;
    }

    page = await journal.createEmbeddedDocuments("JournalEntryPage", [{
      name: pageName,
      type: "text",
      text: {
        content: JSON.stringify(defaultSettings, null, 2),
        format: 1
      },
    }]);

    return defaultSettings;
  }

  try {
    return JSON.parse(page.text.content);
  } catch (e) {
    console.error(`Ошибка парсинга настроек для ${pageName}:`, e);
    return {};
  }
};

/**
 * Сохраняет настройки модуля в соответствующую страницу.
 * @param {JournalEntry} journal - Журнал настроек
 * @param {object} moduleConfig - Конфигурация модуля
 * @param {object} settings - Настройки для сохранения
 */
const saveModuleSettings = async (journal, moduleConfig, settings) => {
  const page = journal.pages.getName(moduleConfig.name);
  if (page) {
    const content = JSON.stringify(settings, null, 2);
    await page.update({ "text.content": content });
  }
};

// --- ГЛАВНАЯ ЛОГИКА ---

/**
 * Показывает все настройки выбранного модуля
 */
const showModuleSettings = async (moduleConfig) => {
  const journal = await getSettingsJournal();
  let currentSettings = await getOrCreateModuleSettingsPage(journal, moduleConfig);

  // Создаем форму с текущими значениями
  let formContent = `<form><div class="form-group"><h2>${moduleConfig.label}</h2></div>`;

  for (const [key, setting] of Object.entries(moduleConfig.settings)) {
    const currentValue = currentSettings[key] !== undefined ? currentSettings[key] : setting.default;
    let inputHtml = '';

    switch (setting.type) {
      case 'image':
        inputHtml = `<input type="text" name="${key}" value="${currentValue}" style="flex-grow: 1; margin-right: 5px;" readonly>
                     <button type="button" class="file-picker" data-setting="${key}">Выбрать</button>`;
        break;
      case 'number':
        inputHtml = `<input type="number" name="${key}" value="${currentValue}" style="width: 100px;">`;
        break;
      case 'text':
        inputHtml = `<input type="text" name="${key}" value="${currentValue}">`;
        break;
      default:
        inputHtml = `<input type="text" name="${key}" value="${currentValue}">`;
    }

    formContent += `
      <div class="form-group">
        <label>${setting.label}:</label>
        <div style="display: flex; align-items: center; gap: 5px;">${inputHtml}</div>
      </div>`;
  }

  formContent += '</form>';

  const dialog = new Dialog({
    title: `Настройки ${moduleConfig.label}`,
    content: formContent,
    buttons: {
      save: {
        icon: '<i class="fas fa-save"></i>',
        label: "Сохранить",
        callback: async (html) => {
          // Обновляем настройки из формы
          const updatedSettings = {};
          for (const [key, setting] of Object.entries(moduleConfig.settings)) {
            switch (setting.type) {
              case 'image':
                updatedSettings[key] = currentSettings[key] || setting.default;
                break;
              case 'number':
                updatedSettings[key] = parseInt(html.find(`[name="${key}"]`).val()) || setting.default;
                break;
              case 'text':
                updatedSettings[key] = html.find(`[name="${key}"]`).val() || setting.default;
                break;
              default:
                updatedSettings[key] = html.find(`[name="${key}"]`).val() || setting.default;
            }
          }

          await saveModuleSettings(journal, moduleConfig, updatedSettings);
          ui.notifications.info(`Настройки ${moduleConfig.label} сохранены!`);
        }
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Отмена",
      },
    },
    default: "save",
    render: (html) => {
      // Добавляем обработчики для кнопок выбора файлов
      html.find('.file-picker').on('click', async (event) => {
        const settingKey = event.currentTarget.dataset.setting;
        new FilePicker({
          type: "imagevideo",
          current: currentSettings[settingKey],
          callback: async (path) => {
            currentSettings[settingKey] = path;
            html.find(`[name="${settingKey}"]`).val(path);
          },
        }).browse();
      });
    }
  });

  dialog.render(true);
};

/**
 * Главная функция, показывающая диалог выбора модуля для настройки.
 */
const showSettingsDialog = async () => {
  const options = MODULES_CONFIG
    .map(module => `<option value="${module.name}">${module.label}</option>`)
    .join("");

  const content = `
    <form>
      <div class="form-group">
        <label for="module-select">Настройки какого модуля вы хотите изменить?</label>
        <select id="module-select" name="module-select">
          ${options}
        </select>
      </div>
    </form>`;

  new Dialog({
    title: "Выбор модуля для настройки",
    content: content,
    buttons: {
      next: {
        icon: '<i class="fas fa-arrow-right"></i>',
        label: "Далее",
        callback: async (html) => {
          const selectedModuleName = html.find("#module-select").val();
          const selectedModule = MODULES_CONFIG.find(m => m.name === selectedModuleName);

          if (selectedModule) {
            await showModuleSettings(selectedModule);
          }
        }
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Отмена",
      },
    },
    default: "next",
  }).render(true);
};

// Запускаем весь процесс
showSettingsDialog();
