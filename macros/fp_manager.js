/**
 * Макрос для полного управления Fate Points игроков и Мастера.
 *
 * ВЕРСИЯ 8.2
 * - ИЗМЕНЕНО: Настройки теперь берутся из отдельной страницы журнала
 */

// --- СИСТЕМНЫЕ КОНСТАНТЫ ---
const SETTINGS_JOURNAL_NAME = "Настройки Макросов";
const FLAG_SCOPE = "core";
const PLAYER_FLAG_KEY = "fatePointTrackerPlayer";
const GM_FLAG_KEY = "gmFatePointTracker";
const GM_FP_SCOPE = "fate-core-official";
const GM_FP_KEY = "gmfatepoints";
const SITUATION_ASPECTS_SCOPE = "fate-core-official";
const SITUATION_ASPECTS_KEY = "situation_aspects";

/**
 * Находит или создает Запись в Журнале и возвращает ее.
 * @returns {Promise<JournalEntry>}
 */
const getSettingsJournal = async () => {
  return game.journal.getName(SETTINGS_JOURNAL_NAME);
};

const getModuleSettings = async (moduleName) => {
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
};

/**
 * Получает настройки FPManager
 */
const getFPManagerSettings = async () => {
  const fpSettings = await getModuleSettings("FPManager");

  // Возвращаем настройки с значениями по умолчанию, если их нет
  return {
    fatePointImage: fpSettings.fatePointImage || "",
    playerPositions: {
      Player1: {
        startPos: {
          x: parseInt(fpSettings.player1X) || 1185,
          y: parseInt(fpSettings.player1Y) || 708
        }
      },
      Player2: {
        startPos: {
          x: parseInt(fpSettings.player2X) || 2145,
          y: parseInt(fpSettings.player2Y) || 740
        }
      },
      Player3: {
        startPos: {
          x: parseInt(fpSettings.player3X) || 3095,
          y: parseInt(fpSettings.player3Y) || 695
        }
      },
    },
    gmConfig: {
      startPos: {
        x: parseInt(fpSettings.gmX) || 3000,
        y: parseInt(fpSettings.gmY) || 2220
      }
    },
    tileOffsets: {
      stepX: parseInt(fpSettings.stepX) || 20,
      stepY: parseInt(fpSettings.stepY) || 20,
      tileSize: {
        width: parseInt(fpSettings.tileWidth) || 70,
        height: parseInt(fpSettings.tileHeight) || 70
      }
    }
  };
};

/**
 * Получает настройки SitAspectManager
 */
const getSitAspectSettings = async () => {
  const sitSettings = await getModuleSettings("SitAspectManager");

  return {
    widgetPosition: {
      x: parseInt(sitSettings.widgetPositionX) || 960,
      y: parseInt(sitSettings.widgetPositionY) || 1415
    },
    widgetSize: {
      width: parseInt(sitSettings.widgetWidth) || 500,
      height: parseInt(sitSettings.widgetHeight) || 800
    },
    widgetFont: {
      family: sitSettings.widgetFontFamily || "BadScript",
      size: parseInt(sitSettings.widgetFontSize) || 32
    }
  };
};

/**
 * Главная функция, запускающая весь процесс.
 */
const main = async () => {
  // 1. Получаем настройки из Журнала
  const fpSettings = await getFPManagerSettings();

  if (!fpSettings.fatePointImage) {
    return ui.notifications.error(
      'Настройка "Изображение для Fate Points" не найдена. Откройте "Менеджер Настроек".',
    );
  }

  // 2. Находим и сортируем персонажей игроков
  const dynamicPlayerConfig = await buildDynamicConfig(fpSettings);

  // 3. Показываем диалог
  showActionDialog(dynamicPlayerConfig, fpSettings);
};

/**
 * Находит всех персонажей игроков, сортирует их и создает динамический конфиг.
 */
const buildDynamicConfig = async (fpSettings) => {
  const players = game.users.filter((user) => !user.isGM);
  const playerActors = game.actors.filter((actor) =>
    players.some((player) =>
      actor.testUserPermission(player, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER),
    ),
  );
  const sortedPlayerActors = playerActors
    .map((actor) => {
      const owner = players.find((p) =>
        actor.testUserPermission(p, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER),
      );
      return { actor, ownerName: owner.name };
    })
    .sort((a, b) => a.ownerName.localeCompare(b.ownerName));

  const dynamicConfig = {};
  const positionKeys = Object.keys(fpSettings.playerPositions);

  for (let i = 0; i < sortedPlayerActors.length; i++) {
    if (i >= positionKeys.length) break;
    const slotName = positionKeys[i];
    dynamicConfig[slotName] = {
      actor: sortedPlayerActors[i].actor,
      startPos: fpSettings.playerPositions[slotName].startPos,
    };
  }

  return dynamicConfig;
};

/**
 * Показывает диалог выбора действия.
 */
const showActionDialog = (playerConfig, fpSettings) => {
  let playerButtonsHtml = "";
  for (const [playerName, config] of Object.entries(playerConfig)) {
    playerButtonsHtml += `
      <div class="player-row">
        <h3>${config.actor.name}</h3>
        <div class="buttons">
          <button class="player-action-button" data-player-name="${playerName}" data-action="give"><i class="fas fa-plus"></i> Дать</button>
          <button class="player-action-button" data-player-name="${playerName}" data-action="take"><i class="fas fa-minus"></i> Забрать</button>
        </div>
      </div>`;
  }
  const content = `
    <style>
      .fco-manager .dialog-content { padding: 5px; }
      .fco-manager .global-actions { display: flex; justify-content: space-around; margin-bottom: 15px; }
      .fco-manager .global-actions button { flex: 1; margin: 0 5px; }
      .fco-manager .section-divider { border-top: 2px solid #666; padding-top: 10px; margin-top: 10px; }
      .fco-manager .player-row h3 { margin: 0 0 5px 0; text-align: center; }
      .fco-manager .player-row .buttons { display: flex; justify-content: space-around; }
      .fco-manager .player-row .buttons button { flex: 1; margin: 0 5px; }
    </style>
    <div class="global-actions">
      <button id="sync-all"><i class="fas fa-sync"></i> Синхронизировать Всех</button>
      <button id="refresh-all"><i class="fas fa-redo"></i> Рефреш Всех</button>
    </div>
    ${playerButtonsHtml}
    <div class="section-divider">
      <div class="player-row">
        <h3>Мастер Игры</h3>
        <div class="buttons">
          <button id="give-gm-fp"><i class="fas fa-plus"></i> Дать</button>
          <button id="take-gm-fp"><i class="fas fa-minus"></i> Забрать</button>
          <button id="new-scene"><i class="fas fa-star"></i> Новая сцена</button>
        </div>
      </div>
    </div>
  `;
  new Dialog(
    {
      title: "Менеджер Fate Points",
      content: content,
      buttons: {
        close: { icon: '<i class="fas fa-times"></i>', label: "Закрыть" },
      },
      render: (html) => {
        html.find("#sync-all").on("click", () => syncAll(playerConfig, fpSettings));
        html.find("#refresh-all").on("click", () => refreshAndSyncAll(playerConfig, fpSettings));
        html.find(".player-action-button").on("click", (event) => {
          const { playerName, action } = event.currentTarget.dataset;
          modifyPlayerFP(playerName, action, playerConfig, fpSettings);
        });
        html.find("#give-gm-fp").on("click", () => modifyGmFP("give", fpSettings));
        html.find("#take-gm-fp").on("click", () => modifyGmFP("take", fpSettings));
        html.find("#new-scene").on("click", () => startNewScene(fpSettings));
      },
    },
    { classes: ["dialog", "fco-manager"], width: 400 },
  ).render(true);
};

// --- ФУНКЦИИ УПРАВЛЕНИЯ ---

const modifyPlayerFP = async (playerName, action, playerConfig, fpSettings) => {
  const actor = playerConfig[playerName]?.actor;
  if (!actor) return;
  const currentFP = getProperty(actor, "system.details.fatePoints.current") || 0;
  const delta = action === "give" ? 1 : -1;
  if (action === "take" && currentFP <= 0) return;
  await actor.update({ "system.details.fatePoints.current": currentFP + delta });
  await syncSinglePlayer(playerName, playerConfig, fpSettings);
};

const modifyGmFP = async (action, fpSettings) => {
  const gm = game.users.find((u) => u.isGM && u.active);
  if (!gm) return ui.notifications.warn("Активный Мастер не найден!");
  const currentFP = gm.getFlag(GM_FP_SCOPE, GM_FP_KEY) || 0;
  const delta = action === "give" ? 1 : -1;
  if (action === "take" && currentFP <= 0) return;
  await gm.setFlag(GM_FP_SCOPE, GM_FP_KEY, currentFP + delta);
  await syncGmPoints(fpSettings);
};

const startNewScene = async (fpSettings) => {
  // Получаем настройки виджета ситуативных аспектов
  const sitSettings = await getSitAspectSettings();

  const currentAspects =
    canvas.scene?.getFlag(SITUATION_ASPECTS_SCOPE, SITUATION_ASPECTS_KEY) || [];
  const setupData = await promptForNewSceneSetup(currentAspects);
  if (!setupData) return ui.notifications.info("Операция 'Новая сцена' отменена.");
  const { playerCount, keptAspects } = setupData;

  const removedAspects = currentAspects.filter(
    (original) => !keptAspects.some((kept) => kept.name === original.name),
  );
  // Удаляем текстовые объекты удалённых аспектов
  for (const aspect of removedAspects) {
    if (aspect.name) {
      const drawing = canvas.scene?.drawings.find((d) =>
        d.text?.startsWith(aspect.name));
      if (drawing) await drawing.delete();
    }
  }

  // Обновляем аспекты в флагах сцены
  await canvas.scene?.setFlag(SITUATION_ASPECTS_SCOPE, SITUATION_ASPECTS_KEY, keptAspects);

  const gm = game.users.find((u) => u.isGM && u.active);
  if (gm) {
    await gm.setFlag(GM_FP_SCOPE, GM_FP_KEY, playerCount);
    ui.notifications.info(`FP Мастера установлены в ${playerCount}.`);
  }

  await clearAllFleetingStress();
  await syncGmPoints(fpSettings);

  // Обновляем или создаём виджет ситуативных аспектов
  await syncWidget(sitSettings);
};

const syncWidget = async (sitSettings) => {
  if (!canvas.scene) {
    ui.notifications.warn("Нет активной сцены для синхронизации.");
    return;
  }

  const aspects = canvas.scene.getFlag(SITUATION_ASPECTS_SCOPE, SITUATION_ASPECTS_KEY) || [];

  const existingWidget = canvas.scene.drawings.find((d) =>
    d.getFlag("core", "situationAspectsWidget"),
  );

  const fullText = aspects
    .map((a) => `${a.name} (${a.free_invokes})`)
    .join("\n\n");

  if (existingWidget) {
    await existingWidget.update({
      text: fullText,
      x: sitSettings.widgetPosition.x,
      y: sitSettings.widgetPosition.y,
      fontSize: sitSettings.widgetFont.size,
      fontFamily: sitSettings.widgetFont.family,
      textColor: "#000000",
      "shape.width": sitSettings.widgetSize.width,
      "shape.height": sitSettings.widgetSize.height,
      "flags.adt.dropShadow": false,
      "flags.adt.fontWeight": 800,
      "flags.advanced-drawing-tools.textStyle.dropShadow": false,
      "flags.advanced-drawing-tools.textStyle.fontWeight": 800,
      "flags.advanced-drawing-tools.textStyle.strokeThickness": 0,
    });
    ui.notifications.info("Виджет ситуативных аспектов обновлен.");
  } else {
    const drawingData = {
      type: 2,
      x: sitSettings.widgetPosition.x,
      y: sitSettings.widgetPosition.y,
      text: fullText,
      fontSize: sitSettings.widgetFont.size,
      fontFamily: sitSettings.widgetFont.family,
      textColor: "#000000",
      fillType: 0,
      strokeWidth: 0,
      shape: {
        width: sitSettings.widgetSize.width,
        height: sitSettings.widgetSize.height,
      },
      flags: {
        core: {
          situationAspectsWidget: true,
        },
        adt: { dropShadow: false, fontWeight: 800 },
        "advanced-drawing-tools": {
          textStyle: {
            dropShadow: false,
            align: "center",
            fontWeight: 800,
            strokeThickness: 0,
          },
        },
      },
    };
    await canvas.scene.createEmbeddedDocuments("Drawing", [drawingData]);
    ui.notifications.info("Виджет situативных аспектов создан на сцене.");
  }
};

const promptForNewSceneSetup = (currentAspects) => {
  let aspectCheckboxes = "";
  if (currentAspects.length > 0) {
    aspectCheckboxes = `
      <hr>
      <p>Какие ситуативные аспекты перенести в новую сцену?</p>
      ${currentAspects
        .map(
          (aspect, index) => `
        <div class="form-group">
          <input type="checkbox" id="keep-aspect-${index}" name="keep-aspect" value="${index}">
          <label for="keep-aspect-${index}">${aspect.name}</label>
        </div>
      `,
        )
        .join("")}
    `;
  }
  const content = `
    <form>
      <div class="form-group">
        <label for="player-count">Сколько игроков в сцене?</label>
        <input type="number" id="player-count" name="player-count" value="3" min="0">
      </div>
      ${aspectCheckboxes}
    </form>`;
  return new Promise((resolve) => {
    new Dialog({
      title: "Настройка новой сцены",
      content: content,
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: "Начать новую сцену",
          callback: (html) => {
            const playerCount = parseInt(html.find("#player-count").val(), 10);
            const keptIndices = html
              .find('input[name="keep-aspect"]:checked')
              .map(function () { return parseInt(this.value, 10); })
              .get();
            const keptAspects = keptIndices.map((index) => currentAspects[index]);
            resolve({ playerCount, keptAspects });
          },
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Отмена",
          callback: () => resolve(null),
        },
      },
      default: "ok",
      close: () => resolve(null),
    }).render(true);
  });
};

const refreshAndSyncAll = async (playerConfig, fpSettings) => {
  ui.notifications.info("Выполнение рефреша Fate Points...");
  for (const config of Object.values(playerConfig)) {
    const actor = config.actor;
    const currentFP = getProperty(actor, "system.details.fatePoints.current") || 0;
    const refreshFP = getProperty(actor, "system.details.fatePoints.refresh") || 0;
    if (currentFP < refreshFP) {
      await actor.update({ "system.details.fatePoints.current": refreshFP });
    }
  }
  await syncAll(playerConfig, fpSettings);
};

const syncAll = async (playerConfig, fpSettings) => {
  ui.notifications.info("Полная синхронизация Fate Points...");
  for (const playerName of Object.keys(playerConfig)) {
    await syncSinglePlayer(playerName, playerConfig, fpSettings);
  }
  await syncGmPoints(fpSettings);
  ui.notifications.info("Синхронизация завершена.");
};

const clearAllFleetingStress = async () => {
  if (!canvas.scene) return;
  ui.notifications.info("Очистка треков стресса...");
  const tokens = canvas.scene.tokens.contents;
  let updates = [];
  let tokenUpdates = [];
  for (const token of tokens) {
    const actor = token.actor;
    if (!actor || !actor.system?.tracks) continue;
    const tracks = foundry.utils.duplicate(actor.system.tracks);
    let changed = false;
    for (const t in tracks) {
      const track = tracks[t];
      if (track.recovery_type === "Fleeting") {
        for (let i = 0; i < track.box_values.length; i++) {
          if (track.box_values[i] === true) {
            track.box_values[i] = false;
            changed = true;
          }
        }
        if (track.aspect?.name) {
          track.aspect.name = "";
          changed = true;
        }
      }
    }
    if (changed) {
      if (!actor.isToken) {
        updates.push({ _id: actor.id, "system.tracks": tracks });
      } else {
        if (foundry.utils.isNewerVersion(game.version, "11.293")) {
          tokenUpdates.push({ _id: token.id, "delta.system.tracks": tracks });
        } else {
          tokenUpdates.push({ _id: token.id, "actorData.system.tracks": tracks });
        }
      }
    }
  }
  if (updates.length > 0) await Actor.updateDocuments(updates);
  if (tokenUpdates.length > 0)
    await canvas.scene.updateEmbeddedDocuments("Token", tokenUpdates);
  ui.notifications.info("Треки стресса очищены.");
};

// --- ФУНКЦИИ СИНХРОНИЗАЦИИ ---

const syncSinglePlayer = async (playerName, playerConfig, fpSettings) => {
  const config = playerConfig[playerName];
  if (!config) return;
  const actor = config.actor;
  const pointsInSheet = getProperty(actor, "system.details.fatePoints.current") || 0;
  const existingTiles = canvas.scene.tiles.filter(
    (t) => t.getFlag(FLAG_SCOPE, PLAYER_FLAG_KEY) === playerName,
  );
  await syncTiles(pointsInSheet, existingTiles, {
    x: config.startPos.x,
    y: config.startPos.y,
    stepX: 0,
    stepY: fpSettings.tileOffsets.stepY,
    flagKey: PLAYER_FLAG_KEY,
    flagValue: playerName,
    imagePath: fpSettings.fatePointImage,
    tileSize: fpSettings.tileOffsets.tileSize
  });
};

const syncGmPoints = async (fpSettings) => {
  const gm = game.users.find((u) => u.isGM && u.active);
  if (!gm) return;
  const pointsInSheet = gm.getFlag(GM_FP_SCOPE, GM_FP_KEY) || 0;
  const existingTiles = canvas.scene.tiles.filter(
    (t) => t.getFlag(FLAG_SCOPE, GM_FLAG_KEY),
  );
  await syncTiles(pointsInSheet, existingTiles, {
    x: fpSettings.gmConfig.startPos.x,
    y: fpSettings.gmConfig.startPos.y,
    stepX: fpSettings.tileOffsets.stepX,
    stepY: 0,
    flagKey: GM_FLAG_KEY,
    flagValue: true,
    imagePath: fpSettings.fatePointImage,
    tileSize: fpSettings.tileOffsets.tileSize
  });
};

const syncTiles = async (targetCount, existingTiles, options) => {
  const difference = targetCount - existingTiles.length;
  if (difference > 0) {
    const tilesToCreateData = [];
    for (let i = 0; i < difference; i++) {
      const index = existingTiles.length + i;
      const newX = options.x - index * options.stepX;
      const newY = options.y + index * options.stepY;
      tilesToCreateData.push({
        texture: { src: options.imagePath },
        x: newX,
        y: newY,
        width: options.tileSize.width,
        height: options.tileSize.height,
        flags: { [FLAG_SCOPE]: { [options.flagKey]: options.flagValue } },
      });
    }
    await canvas.scene.createEmbeddedDocuments("Tile", tilesToCreateData);
  } else if (difference < 0) {
    const sortedTiles = existingTiles.sort(
      (a, b) => a.x + a.y - (b.x + b.y),
    );
    const tilesToDelete = sortedTiles.slice(difference);
    const idsToDelete = tilesToDelete.map((tile) => tile.id);
    await canvas.scene.deleteEmbeddedDocuments("Tile", idsToDelete);
  }
};

// Запускаем весь процесс
main();
