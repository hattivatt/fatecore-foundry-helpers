/**
 * Макрос для автоматического создания/обновления виджетов для всех игроков.
 *
 * ВЕРСИЯ 8.0 (Использует настройки из журнала)
 * - Настройки берутся из журнала "Настройки Макросов"
 * - Упрощена структура констант
 */

// --- СИСТЕМНЫЕ КОНСТАНТЫ (лучше не трогать) ---
const FLAG_SCOPE        = "core";
const ACTOR_ID_FLAG     = "characterWidgetActorId";
const PART_ID_FLAG      = "widgetPart";
const POSITION_KEY_FLAG = "widgetPositionKey";
const SETTINGS_JOURNAL_NAME = "Настройки Макросов";
const PLAYER_WIDGET_PAGE = "PlayerWidgetManager";

async function getSettingsFromJournal() {
  const journal = game.journal.getName(SETTINGS_JOURNAL_NAME);
  if (!journal) {
    ui.notifications.error("Журнал настроек не найден!");
    return null;
  }

  const page = journal.pages.getName(PLAYER_WIDGET_PAGE);
  if (!page) {
    ui.notifications.error("Страница настроек виджетов не найдена!");
    return null;
  }

  try {
    return JSON.parse(page.text.content);
  } catch (e) {
    console.error("Ошибка парсинга настроек:", e);
    ui.notifications.error("Ошибка при чтении настроек из журнала");
    return null;
  }
}

async function main() {
  ui.notifications.info("Синхронизация панелей игроков...");

  // Получаем настройки из журнала
  const settings = await getSettingsFromJournal();
  if (!settings) return;

  const players = game.users.filter(u => !u.isGM);
  if (!players.length) {
    ui.notifications.warn("В игре нет активных игроков.");
    return;
  }

  const playerActors = game.actors.filter(a =>
    players.some(p =>
      a.testUserPermission(p, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
    )
  );

  const sorted = playerActors
    .map(actor => {
      const owner = players.find(p =>
        actor.testUserPermission(p, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
      );
      return { actor, ownerName: owner.name };
    })
    .sort((a, b) => a.ownerName.localeCompare(b.ownerName));

  const playerKeys = ["Player 1", "Player 2", "Player 3"];
  for (let i = 0; i < playerKeys.length; i++) {
    const key = playerKeys[i];
    const entry = sorted[i];
    if (entry) await handleSlotUpdate(entry.actor, key, settings);
    else      await handleSlotCleanup(key);
  }
  ui.notifications.info("Синхронизация панелей завершена.");
}

async function handleSlotUpdate(actor, positionKey, settings) {
  const portrait = actor.img;
  const aspects = actor.system.aspects
    ? Object.values(actor.system.aspects)
        .map(a => a.value)
        .filter(v => v?.trim())
    : [];
  const isDefault = portrait.includes("mystery-man.svg");
  if (!aspects.length || isDefault) {
    ui.notifications.warn(
      `Чарлист для "${actor.name}" не заполнен. Слот ${positionKey} очищен.`
    );
    return handleSlotCleanup(positionKey);
  }

  // Используем настройки для позиций
  await processPart(
    actor,
    "portrait",
    { x: settings[`${getPositionKey(positionKey)}PortraitX`], y: settings[`${getPositionKey(positionKey)}PortraitY`] },
    { src: portrait },
    positionKey,
    settings
  );

  await processPart(
    actor,
    "name",
    { x: settings[`${getPositionKey(positionKey)}NameX`], y: settings[`${getPositionKey(positionKey)}NameY`] },
    { text: actor.name },
    positionKey,
    settings
  );

  await processPart(
    actor,
    "aspects",
    { x: settings[`${getPositionKey(positionKey)}AspectsX`], y: settings[`${getPositionKey(positionKey)}AspectsY`] },
    { text: aspects.join("\n\n") },
    positionKey,
    settings
  );

  await processSkills(actor, positionKey, settings);
  await processPhysicalStress(actor, positionKey, settings);
}

function getPositionKey(positionKey) {
  switch(positionKey) {
    case "Player 1": return "player1";
    case "Player 2": return "player2";
    case "Player 3": return "player3";
    default: return "";
  }
}

async function handleSlotCleanup(positionKey) {
  const all = [ ...canvas.scene.drawings, ...canvas.scene.tiles ];
  const toDel = all.filter(d =>
    d.getFlag(FLAG_SCOPE, POSITION_KEY_FLAG) === positionKey
  );
  const tileIds = toDel.filter(d => d instanceof TileDocument).map(d => d.id);
  const drawIds = toDel.filter(d => d instanceof DrawingDocument)
    .map(d => d.id);
  if (tileIds.length) await canvas.scene.deleteEmbeddedDocuments("Tile", tileIds);
  if (drawIds.length) await canvas.scene.deleteEmbeddedDocuments("Drawing", drawIds);
}

async function processPart(actor, partType, pos, content, positionKey, settings) {
  const isPortrait = partType === "portrait";
  const collection = isPortrait ? canvas.scene.tiles : canvas.scene.drawings;
  const existing = collection.find(d =>
    d.getFlag(FLAG_SCOPE, POSITION_KEY_FLAG) === positionKey &&
    d.getFlag(FLAG_SCOPE, PART_ID_FLAG) === partType
  );
  const baseFlag = { [FLAG_SCOPE]: { [ACTOR_ID_FLAG]: actor.id } };

  if (existing) {
    const u = { x: pos.x, y: pos.y, flags: baseFlag };
    if (isPortrait) {
      u["texture.src"] = content.src;
      u.width  = settings.portraitSizeWidth;
      u.height = settings.portraitSizeHeight;
    } else {
      let size, fSize, fFamily, sWidth = 0, sColor, extra = {};
      if (partType === "name") {
        size = { width: settings.nameSizeWidth, height: settings.nameSizeHeight };
        fSize = settings.nameFontSize;
        fFamily = settings.fontFamily;
        extra.fontWeight = 800;
      } else if (partType === "aspects") {
        size = { width: settings.aspectsSizeWidth, height: settings.aspectsSizeHeight };
        fSize = settings.aspectsFontSize;
        fFamily = settings.fontFamily;
      } else if (partType.startsWith("skillName")) {
        size = { width: settings.skillNameSizeWidth, height: settings.skillNameSizeHeight };
        fSize = settings.skillNameFontSize;
        fFamily = settings.skillNameFont;
        sWidth = 2; sColor = "#000000";
      } else if (partType.startsWith("skillValue")) {
        size = { width: settings.skillValueSizeWidth, height: settings.skillValueSizeHeight };
        fSize = settings.skillValueFontSize;
        fFamily = settings.skillValueFont;
        extra.fontWeight = 800;
        sWidth = 2; sColor = "#000000";
      } else if (partType.startsWith("stressBox")) {
        size = { width: settings.stressBoxSizeWidth, height: settings.stressBoxSizeHeight };
        fSize = settings.stressFontSize;
        fFamily = settings.stressFontFamily;
        sWidth = settings.stressLineWidth;
        sColor = "#000000";
        extra.align = "center";
      }
      u.text           = content.text;
      u.fontSize       = fSize;
      u.fontFamily     = fFamily;
      u.textColor      = "#000000";
      u.fillType       = 0;
      u.strokeWidth    = sWidth;
      if (sColor) u.strokeColor = sColor;
      u["shape.width"]  = size.width;
      u["shape.height"] = size.height;
      u.flags = {
        [FLAG_SCOPE]: { [ACTOR_ID_FLAG]: actor.id },
        adt: { dropShadow: false },
        "advanced-drawing-tools": {
          textStyle: Object.assign(
            {
              dropShadow: false,
              strokeThickness: 0
            },
            extra
          )
        }
      };
    }
    await existing.update(u);
  } else {
    let d = {
      x: pos.x, y: pos.y,
      flags: {
        [FLAG_SCOPE]: {
          [ACTOR_ID_FLAG]: actor.id,
          [PART_ID_FLAG]: partType,
          [POSITION_KEY_FLAG]: positionKey
        }
      }
    };
    if (isPortrait) {
      d.texture = { src: content.src };
      d.width   = settings.portraitSizeWidth;
      d.height  = settings.portraitSizeHeight;
      await canvas.scene.createEmbeddedDocuments("Tile", [d]);
    } else {
      let size, fSize, fFamily, sWidth = 0, sColor, extra = {};
      if (partType === "name") {
        size = { width: settings.nameSizeWidth, height: settings.nameSizeHeight };
        fSize = settings.nameFontSize;
        fFamily = settings.fontFamily;
        extra.fontWeight = 800;
      } else if (partType === "aspects") {
        size = { width: settings.aspectsSizeWidth, height: settings.aspectsSizeHeight };
        fSize = settings.aspectsFontSize;
        fFamily = settings.fontFamily;
      } else if (partType.startsWith("skillName")) {
        size = { width: settings.skillNameSizeWidth, height: settings.skillNameSizeHeight };
        fSize = settings.skillNameFontSize;
        fFamily = settings.skillNameFont;
        sWidth = 2; sColor = "#000000";
      } else if (partType.startsWith("skillValue")) {
        size = { width: settings.skillValueSizeWidth, height: settings.skillValueSizeHeight };
        fSize = settings.skillValueFontSize;
        fFamily = settings.skillValueFont;
        extra.fontWeight = 800;
        sWidth = 2; sColor = "#000000";
      } else if (partType.startsWith("stressBox")) {
        size = { width: settings.stressBoxSizeWidth, height: settings.stressBoxSizeHeight };
        fSize = settings.stressFontSize;
        fFamily = settings.stressFontFamily;
        sWidth = settings.stressLineWidth;
        sColor = "#000000";
        extra.align = "center";
      }
      d = {
        ...d,
        type       : 2,
        text       : content.text,
        fontSize   : fSize,
        fontFamily : fFamily,
        textColor  : "#000000",
        fillType   : 0,
        strokeWidth: sWidth,
        ...(sColor ? { strokeColor: sColor } : {}),
        shape      : { width: size.width, height: size.height },
        flags      : {
          ...d.flags,
          adt: { dropShadow: false },
          "advanced-drawing-tools": {
            textStyle: Object.assign(
              {
                dropShadow: false,
                strokeThickness: 0
              },
              extra
            )
          }
        }
      };
      await canvas.scene.createEmbeddedDocuments("Drawing", [d]);
    }
  }
}

async function processSkills(actor, positionKey, settings) {
  const list = Object.values(actor.system.skills || {})
    .filter(s => s.rank > 0);
  if (!list.length) return;

  const groups = list.reduce((acc, s) => {
    (acc[s.rank] = acc[s.rank] || []).push(s.name);
    return acc;
  }, {});

  const ranks = Object.keys(groups)
    .map(n => +n).sort((a, b) => b - a);

  const prefix = getPositionKey(positionKey);
  const baseNamePos = {
    x: settings[`${prefix}SkillNameX`],
    y: settings[`${prefix}SkillNameY`]
  };
  const baseValuePos = {
    x: settings[`${prefix}SkillValueX`],
    y: settings[`${prefix}SkillValueY`]
  };

  for (let i = 0; i < ranks.length; i++) {
    const r = ranks[i];
    const names = groups[r].join(", ");
    const val   = "+" + r;
    const np = { x: baseNamePos.x,  y: baseNamePos.y  + 48 * i };
    const vp = { x: baseValuePos.x, y: baseValuePos.y + 48 * i };
    await processPart(actor, `skillName_${r}`,  np, { text: names }, positionKey, settings);
    await processPart(actor, `skillValue_${r}`, vp, { text: val   }, positionKey, settings);
  }
}

async function processPhysicalStress(actor, positionKey, settings) {
  // Получаем позиции из настроек
  const prefix = getPositionKey(positionKey);
  const startPos = {
    x: settings[`${prefix}StressStartX`],
    y: settings[`${prefix}StressStartY`]
  };

  // Найти трек "Physical Stress"
  const physicalStressTrack = Object.values(actor.system.tracks || {})
    .find(track => track.name === "Физический Стресс");

  if (!physicalStressTrack) {
    console.warn(`У актера ${actor.name} не найден трек "Физический Стресс"`);
    return;
  }

  const boxValues = physicalStressTrack.box_values || [];

  // Удалить старые боксы
  const all = [...canvas.scene.drawings, ...canvas.scene.tiles];
  const toDel = all.filter(d =>
    d.getFlag(FLAG_SCOPE, POSITION_KEY_FLAG) === positionKey &&
    d.getFlag(FLAG_SCOPE, PART_ID_FLAG)?.startsWith("stressBox")
  );
  const drawIds = toDel.map(d => d.id);
  if (drawIds.length) {
    await canvas.scene.deleteEmbeddedDocuments("Drawing", drawIds);
  }

  // Создать новые боксы
  for (let i = 0; i < boxValues.length; i++) {
    const value = boxValues[i];
    const text = value ? "X" : " "; // true -> "X", false -> " "
    const pos = {
      x: startPos.x + i * settings.stressSpacingX,
      y: startPos.y
    };
    await processPart(
      actor,
      `stressBox_${i}`,
      pos,
      { text },
      positionKey,
      settings
    );
  }
}

main();
