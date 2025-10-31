/**
 * Макрос для полного управления ситуативными аспектами на сцене.
 *
 * ВЕРСИЯ 4.1 (Foundry 12 fix)
 * - ИСПРАВЛЕНО: Проблема сложения free_invokes как строка
 * - ИСПРАВЛЕНО: Совместимость с Foundry V12 API
 */

// --- СИСТЕМНЫЕ КОНСТАНТЫ ---
const FLAG_SCOPE = "fate-core-official";
const FLAG_KEY = "situation_aspects";
const DIALOG_ID = "situation-aspect-manager";
const WIDGET_FLAG_SCOPE = "core";
const WIDGET_FLAG_KEY = "situationAspectsWidget";
const SETTINGS_JOURNAL_NAME = "Настройки Макросов";

// --- ФУНКЦИИ ДЛЯ ПОЛУЧЕНИЯ НАСТРОЕК ---
async function getSettingsJournal() {
  return game.journal.getName(SETTINGS_JOURNAL_NAME);
}

async function getModuleSettings(moduleName) {
  const journal = await getSettingsJournal();
  if (!journal) return {};

  const page = journal.pages.getName(moduleName);
  if (!page) return {};

  try {
    return JSON.parse(page.text.content);
  } catch (e) {
    console.error(`Ошибка парсинга настроек для ${moduleName}:`, e);
    return {};
  }
}

// --- ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ НАСТРОЕК ВИДЖЕТА ---
async function getWidgetSettings() {
  const sitAspectSettings = await getModuleSettings("SitAspectManager");

  return {
    position: sitAspectSettings.widgetPosition || { x: 960, y: 1415 },
    size: sitAspectSettings.widgetSize || { width: 500, height: 800 },
    font: sitAspectSettings.widgetFont || { family: "BadScript", size: 32 }
  };
}

/**
 * Главная функция, которая строит и отображает менеджер аспектов.
 */
async function showAspectManager() {
  const existingDialog = Object.values(ui.windows).find(w => w.id === DIALOG_ID);
  if (existingDialog) {
    existingDialog.bringToTop();
    return;
  }

  const widgetSettings = await getWidgetSettings();

  let aspects = foundry.utils.deepClone(
    canvas.scene.getFlag(FLAG_SCOPE, FLAG_KEY) || []
  );

  // Убеждаемся, что free_invokes — число
  aspects = aspects.map(a => ({
    ...a,
    free_invokes: Number(a.free_invokes) || 0,
  }));

  function redrawAspectList(dialogHtml) {
    let aspectListHtml = "";
    if (aspects.length > 0) {
      aspectListHtml = aspects
        .map((aspect, index) => `
          <div class="aspect-row">
            <button class="rename-btn" data-index="${index}" title="Переименовать аспект"><i class="fas fa-edit"></i></button>
            <button class="delete-btn" data-index="${index}" title="Удалить аспект"><i class="fas fa-trash"></i></button>
            <span class="aspect-name">${aspect.name}</span>
            <div class="aspect-controls">
              <button class="invoke-btn" data-index="${index}" data-action="take"><i class="fas fa-minus"></i></button>
              <span class="invoke-count">${aspect.free_invokes}</span>
              <button class="invoke-btn" data-index="${index}" data-action="give"><i class="fas fa-plus"></i></button>
            </div>
          </div>
        `).join("");
    } else {
      aspectListHtml = `<p style="text-align:center; opacity:0.7;">Нет активных ситуативных аспектов.</p>`;
    }
    dialogHtml.find(".aspect-list").html(aspectListHtml);

    // Слушатели событий
    dialogHtml.find(".invoke-btn").on("click", (event) => {
      const { index, action } = event.currentTarget.dataset;
      const idx = parseInt(index, 10);
      if (aspects[idx]) {
        aspects[idx].free_invokes += action === "give" ? 1 : -1;
        aspects[idx].free_invokes = Math.max(0, aspects[idx].free_invokes);
        redrawAspectList(dialogHtml);
      }
    });

    dialogHtml.find(".delete-btn").on("click", (event) => {
      const indexToDelete = parseInt(event.currentTarget.dataset.index, 10);
      promptForDeletion(aspects, indexToDelete, () => redrawAspectList(dialogHtml));
    });

    dialogHtml.find(".rename-btn").on("click", (event) => {
      const indexToRename = parseInt(event.currentTarget.dataset.index, 10);
      promptForRename(aspects, indexToRename, () => redrawAspectList(dialogHtml));
    });
  }

  const content = `
    <style>
      #${DIALOG_ID} .dialog-content { padding: 5px; }
      .aspect-row { display: flex; justify-content: space-between; align-items: center; padding: 5px; border-bottom: 1px solid #ccc; gap: 5px; }
      .aspect-row:last-child { border-bottom: none; }
      .aspect-name { font-weight: bold; flex-grow: 1; }
      .aspect-controls { display: flex; align-items: center; }
      .invoke-count { font-size: 1.2em; margin: 0 10px; min-width: 20px; text-align: center; }
      .rename-btn { flex: 0 0 40px; background-color: #e0e0e0; }
      .delete-btn { flex: 0 0 40px; }
      .invoke-btn { flex: 0 0 30px; }
      .global-buttons { display: flex; justify-content: space-around; margin-top: 10px; }
      .global-buttons button { flex: 1; margin: 0 5px; }
    </style>
    <div class="aspect-list"></div>
    <div class="global-buttons">
      <button id="add-aspect"><i class="fas fa-plus-circle"></i> Добавить</button>
      <button id="to-scene"><i class="fas fa-map-pin"></i> На стол</button>
    </div>
  `;

  new Dialog({
      title: "Менеджер ситуативных аспектов",
      content: content,
      buttons: {
        save: {
          icon: '<i class="fas fa-save"></i>',
          label: "Сохранить и закрыть",
          callback: async () => {
            await canvas.scene.setFlag(FLAG_SCOPE, FLAG_KEY, aspects);
            await updateWidgetOnScene(aspects);
            ui.notifications.info("Ситуативные аспекты сохранены.");
          },
        },
      },
      render: (html) => {
        redrawAspectList(html);
        html.find("#add-aspect").on("click", () => {
          promptForNewAspect(aspects, () => redrawAspectList(html));
        });
        html.find("#to-scene").on("click", () => {
          updateWidgetOnScene(aspects);
        });
      },
    },
    { id: DIALOG_ID, width: 400 }
  ).render(true);
}

// --- ФУНКЦИЯ ДЛЯ УПРАВЛЕНИЯ ВИДЖЕТОМ ---
async function updateWidgetOnScene(aspects) {
  const widgetSettings = await getWidgetSettings();
  const WIDGET_POSITION = widgetSettings.position;
  const WIDGET_SIZE = widgetSettings.size;
  const WIDGET_FONT_FAMILY = widgetSettings.font.family;
  const WIDGET_FONT_SIZE = widgetSettings.font.size;

  const existingWidget = canvas.scene.drawings.find(d =>
    d.getFlag(WIDGET_FLAG_SCOPE, WIDGET_FLAG_KEY)
  );

  const fullText = aspects
    .map(a => `${a.name} (${a.free_invokes})`)
    .join("\n\n");

  const widgetData = {
    text: fullText,
    x: WIDGET_POSITION.x,
    y: WIDGET_POSITION.y,
    fontSize: WIDGET_FONT_SIZE,
    fontFamily: WIDGET_FONT_FAMILY,
    textColor: "#000000",
    shape: {
      width: WIDGET_SIZE.width,
      height: WIDGET_SIZE.height
    },
    flags: {
      [WIDGET_FLAG_SCOPE]: { [WIDGET_FLAG_KEY]: true },
      adt: { dropShadow: false, fontWeight: 800 },
      "advanced-drawing-tools": {
        textStyle: { dropShadow: false, align: "center", fontWeight: 800, strokeThickness: 0 }
      }
    }
  };

  if (existingWidget) {
    await existingWidget.update(widgetData);
    ui.notifications.info("Виджет аспектов на сцене обновлен.");
  } else {
    await canvas.scene.createEmbeddedDocuments("Drawing", [widgetData]);
    ui.notifications.info("Виджет аспектов создан на сцене.");
  }
}

// --- ВСПОМОГАТЕЛЬНЫЕ ДИАЛОГИ ---

function promptForNewAspect(currentAspects, onUpdateCallback) {
  const content = `
    <form>
      <div class="form-group">
        <label>Название аспекта:</label>
        <input type="text" name="name" placeholder="Например, 'В огне!'">
      </div>
      <div class="form-group">
        <label>Количество призывов:</label>
        <input type="number" name="invokes" value="1" min="0">
      </div>
    </form>`;

  new Dialog({
    title: "Добавить ситуативный аспект",
    content: content,
    buttons: {
      create: {
        icon: '<i class="fas fa-check"></i>',
        label: "Добавить",
        callback: (html) => {
          const name = html.find('[name="name"]').val().trim();
          const invokes = parseInt(html.find('[name="invokes"]').val(), 10) || 0;
          if (!name) return ui.notifications.warn("Название не может быть пустым.");
          currentAspects.push({ name: name, free_invokes: invokes });
          onUpdateCallback();
        }
      }
    },
    default: "create"
  }).render(true);
}

function promptForDeletion(currentAspects, indexToDelete, onUpdateCallback) {
  const aspectToDelete = currentAspects[indexToDelete];
  if (!aspectToDelete) return;

  Dialog.confirm({
    title: "Удалить аспект",
    content: `<p>Вы уверены, что хотите удалить аспект "<strong>${aspectToDelete.name}</strong>"?</p>`,
    yes: async () => {
      currentAspects.splice(indexToDelete, 1);
      if (aspectToDelete.name) {
        const drawing = canvas.scene.drawings.find(d =>
          d.text?.startsWith(aspectToDelete.name)
        );
        if (drawing) {
          await canvas.scene.deleteEmbeddedDocuments("Drawing", [drawing.id]);
        }
      }
      onUpdateCallback();
    },
    no: () => {},
    defaultYes: false
  });
}

function promptForRename(currentAspects, indexToRename, onUpdateCallback) {
  const oldName = currentAspects[indexToRename]?.name;
  if (!oldName) return;

  const content = `
    <form>
      <div class="form-group">
        <label>Новое название аспекта:</label>
        <input type="text" name="newName" value="${oldName}" />
      </div>
    </form>`;

  new Dialog({
    title: "Переименование аспекта",
    content: content,
    buttons: {
      rename: {
        icon: '<i class="fas fa-check"></i>',
        label: "Переименовать",
        callback: (html) => {
          const newName = html.find('[name="newName"]').val().trim();
          if (!newName) {
            ui.notifications.warn("Название аспекта не может быть пустым.");
            return;
          }
          currentAspects[indexToRename].name = newName;
          onUpdateCallback();
        }
      }
    },
    default: "rename"
  }).render(true);
}

// --- ЗАПУСК ---
showAspectManager();
