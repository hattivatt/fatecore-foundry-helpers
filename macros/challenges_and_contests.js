/**
 * Универсальный макрос для создания Challenge/Contest (Fate Core) или обновления существующих Drawing'ов.
 * Настройки хранятся в Журнале.
 */

// === НАСТРОЙКИ ИЗ ЖУРНАЛА ===
const SETTINGS_JOURNAL_NAME = "Настройки Макросов";
const MODULE_NAME = "ChallengeContestManager";

// Функция для получения настроек из журнала
const getModuleSettings = async () => {
  const journal = game.journal.getName(SETTINGS_JOURNAL_NAME);
  if (!journal) {
    ui.notifications.error(`Журнал настроек "${SETTINGS_JOURNAL_NAME}" не найден!`);
    return null;
  }

  const page = journal.pages.getName(MODULE_NAME);
  if (!page) {
    ui.notifications.error(`Страница настроек "${MODULE_NAME}" не найдена в журнале!`);
    return null;
  }

  try {
    const settings = JSON.parse(page.text.content);
    // Преобразуем строковые булевы значения
    settings.challengeAddBackground = settings.challengeAddBackground === "true";
    settings.contestAddBackground = settings.contestAddBackground === "true";
    return settings;
  } catch (e) {
    console.error(`Ошибка парсинга настроек для ${MODULE_NAME}:`, e);
    return null;
  }
};

// Основная логика макроса
const runMacro = async () => {
  const settings = await getModuleSettings();
  if (!settings) {
    ui.notifications.error("Не удалось загрузить настройки. Проверьте журнал настроек.");
    return;
  }

  const selected = canvas.activeLayer.controlled;

  if (selected.length === 1 && selected[0] instanceof Drawing) {
    const drawing = selected[0];
    const oldText = drawing.document.text;
    const unchecked = "[   ]";
    const checked = "[ X ]";

    if (oldText.includes(unchecked)) {
      const newText = oldText.replace(unchecked, checked);
      await drawing.document.update({ text: newText });
    } else {
      ui.notifications.info("Все пункты в этом списке уже отмечены!");
    }
  } else {
    if (!canvas || !canvas.ready) {
      ui.notifications.warn("Холст не активен или не готов. Откройте сцену.");
      return;
    }
    if (!game.user.can("DRAWING_CREATE")) {
      ui.notifications.error("У вас нет прав для создания рисунков на этой сцене.");
      return;
    }

    let type = await new Promise((resolve) => {
      new Dialog({
        title: "Выберите тип",
        content: `<p>Что создаём?</p>`,
        buttons: {
          challenge: {
            label: "Challenge",
            callback: () => resolve("challenge"),
          },
          contest: {
            label: "Contest",
            callback: () => resolve("contest"),
          },
          cancel: {
            label: "Отмена",
            callback: () => resolve(null),
          },
        },
        default: "challenge",
        close: () => resolve(null),
      }).render(true);
    });

    if (!type) return;

    if (type === "challenge") {
      const promptForItemCount = () => {
        return new Promise((resolve) => {
          new Dialog({
            title: "Количество пунктов",
            content: `
            <form>
              <div class="form-group">
                <label for="item-count">Сколько пунктов будет в списке?</label>
                <input type="number" id="item-count" name="item-count" value="3" min="1" max="20">
              </div>
            </form>`,
            buttons: {
              next: {
                label: "Далее",
                callback: (html) => {
                  const count = parseInt(html.find("#item-count").val(), 10);
                  resolve(count);
                },
              },
              cancel: {
                label: "Отмена",
                callback: () => resolve(null),
              },
            },
            default: "next",
            close: () => resolve(null),
          }).render(true);
        });
      };

      const promptForItems = (count) => {
        let formContent = `
          <style>
            .task-item-grid {
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 10px;
              align-items: center;
              margin-bottom: 5px;
            }
            .task-item-grid input[type="number"] { width: 60px; text-align: center; }
          </style>
          <div class="form-group">
            <label>Текст задачи</label>
            <label style="text-align:center;">Сложность</label>
          </div>
        `;

        for (let i = 1; i <= count; i++) {
          formContent += `
          <div class="form-group task-item-grid">
            <input type="text" id="line${i}" name="line${i}" placeholder="Пункт ${i}...">
            <input type="number" id="difficulty${i}" name="difficulty${i}" value="2" min="0">
          </div>`;
        }

        return new Promise((resolve) => {
          new Dialog({
            title: "Введите задачи и их сложность",
            content: `<form>${formContent}</form>`,
            buttons: {
              create: {
                label: "Создать",
                callback: (html) => {
                  const form = html.find("form")[0];
                  const formData = new FormDataExtended(form).object;
                  const tasks = [];
                  for (let i = 1; i <= count; i++) {
                    const text = formData[`line${i}`];
                    if (text && text.trim() !== "") {
                      const difficulty = formData[`difficulty${i}`] || 2;
                      tasks.push({ text, difficulty });
                    }
                  }
                  resolve(tasks);
                },
              },
              cancel: {
                label: "Отмена",
                callback: () => resolve(null),
              },
            },
            default: "create",
          }).render(true);
        });
      };

      const createDrawing = async (tasks) => {
        const center = canvas.stage.pivot;
        const startX = center.x - 250;
        const startY = center.y - 100;

        const fontSize = settings.challengeFontSize;
        const fontFamily = settings.challengeFontFamily;
        const textColor = "#000000";
        const textWidth = 500;
        const textHeight = tasks.length * 90;
        const checkbox = "[   ]";

        const fullText = tasks.map((task) => `${checkbox} ${task.text} +${task.difficulty}`).join("\n\n");

        const drawingData = {
          type: 2,
          x: startX,
          y: startY,
          text: fullText,
          fontSize: fontSize,
          fontFamily: fontFamily,
          textColor: textColor,
          fillType: settings.challengeAddBackground ? 1 : 0,
          fillColor: settings.challengeBackgroundColor,
          fillAlpha: 1,
          strokeWidth: 0,
          shape: { width: textWidth, height: textHeight },
          flags: {
            adt: { dropShadow: false },
            "advanced-drawing-tools": { textStyle: { dropShadow: false } },
          },
        };

        await canvas.scene.createEmbeddedDocuments("Drawing", [drawingData]);
        ui.notifications.info(`Создан список из ${tasks.length} задач.`);
      };

      const count = await promptForItemCount();
      if (!count || count <= 0) return;

      const tasks = await promptForItems(count);
      if (!tasks || tasks.length === 0) return;

      await createDrawing(tasks);
    }

    else if (type === "contest") {
      const promptForSideCount = () => {
        return new Promise((resolve) => {
          new Dialog({
            title: "Количество сторон",
            content: `
            <form>
              <div class="form-group">
                <label for="side-count">Сколько сторон будет у состязания?</label>
                <input type="number" id="side-count" name="side-count" value="2" min="1" max="10">
              </div>
            </form>`,
            buttons: {
              next: {
                label: "Далее",
                callback: (html) => {
                  const count = parseInt(html.find("#side-count").val(), 10);
                  resolve(count);
                },
              },
              cancel: {
                label: "Отмена",
                callback: () => resolve(null),
              },
            },
            default: "next",
            close: () => resolve(null),
          }).render(true);
        });
      };

      const promptForSideDetails = (count) => {
        let formContent = `
          <style>
            .side-item-grid {
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 10px;
              align-items: center;
              margin-bottom: 5px;
            }
            .side-item-grid input[type="number"] { width: 60px; text-align: center; }
          </style>
          <div class="form-group">
            <label>Название стороны</label>
            <label style="text-align:center;">Чекбоксы</label>
          </div>
        `;

        for (let i = 1; i <= count; i++) {
          formContent += `
          <div class="form-group side-item-grid">
            <input type="text" id="side${i}" name="side${i}" placeholder="Сторона ${i}">
            <input type="number" id="boxes${i}" name="boxes${i}" value="3" min="1" max="20">
          </div>`;
        }

        return new Promise((resolve) => {
          new Dialog({
            title: "Введите стороны и количество чекбоксов",
            content: `<form>${formContent}</form>`,
            buttons: {
              create: {
                label: "Создать",
                callback: (html) => {
                  const form = html.find("form")[0];
                  const formData = new FormDataExtended(form).object;
                  const sides = [];
                  for (let i = 1; i <= count; i++) {
                    const name = formData[`side${i}`] || `Сторона ${i}`;
                    const boxes = parseInt(formData[`boxes${i}`]) || 3;
                    sides.push({ name, boxes });
                  }
                  resolve(sides);
                },
              },
              cancel: {
                label: "Отмена",
                callback: () => resolve(null),
              },
            },
            default: "create",
          }).render(true);
        });
      };

      const createContestDrawings = async (sides) => {
        if (!sides.length) return;

        const center = canvas.stage.pivot;
        const startX = center.x - 400;
        let startY = center.y - (sides.length * 30);

        const fontSize = settings.contestFontSize;
        const fontFamily = settings.contestFontFamily;
        const textColor = "#000000";
        const textWidth = 700;
        const textHeight = 60;
        const checkbox = "[   ]";

        const drawingDataArray = [];

        for (const side of sides) {
          const checkboxString = checkbox.repeat(side.boxes);
          const fullText = `${side.name}: ${checkboxString}`;

          drawingDataArray.push({
            type: 2,
            x: startX,
            y: startY,
            text: fullText,
            fontSize: fontSize,
            fontFamily: fontFamily,
            textColor: textColor,
            fillType: settings.contestAddBackground ? 1 : 0,
            fillColor: settings.contestBackgroundColor,
            fillAlpha: 1,
            strokeWidth: 0,
            shape: { width: textWidth, height: textHeight },
            flags: {
              adt: { dropShadow: false },
              "advanced-drawing-tools": { textStyle: { dropShadow: false } },
            },
          });

          startY += textHeight + 10;
        }

        await canvas.scene.createEmbeddedDocuments("Drawing", drawingDataArray);
        ui.notifications.info(`Создано состязание из ${sides.length} сторон.`);
      };

      const sideCount = await promptForSideCount();
      if (!sideCount || sideCount <= 0) return;

      const sides = await promptForSideDetails(sideCount);
      if (!sides || !sides.length) return;

      await createContestDrawings(sides);
    }
  }
};

// Запуск макроса
runMacro();
