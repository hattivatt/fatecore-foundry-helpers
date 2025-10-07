/**
 * Макрос для Ad-Hoc броска в системе Fate Core Official.
 *
 * Этот макрос является прямой адаптацией функции _fu_adhoc_roll
 * из кода модуля, что обеспечивает полную совместимость.
 * Он вызывает тот же диалог и выполняет тот же бросок,
 * что и кнопка в интерфейсе системы.
 */

// Проверка, что игровая система Fate Core Official активна
if (game.system.id !== "fate-core-official") {
  ui.notifications.error(
    "Этот макрос предназначен только для игровой системы Fate Core Official.",
  );
  return;
}

// --- Начало кода, адаптированного из модуля ---

let name = "";
let skill = "";
let modifier = 0;
let flavour = "";

// Получаем пользовательские формулы броска из настроек модуля
let fs = game.settings.get("fate-core-official", "fu-roll-formulae");
let showFormulae = false;
let formulae = [];
if (fs) {
  formulae = fs.split(",").map((item) => item.trim());
  if (formulae.length > 1) showFormulae = true;
  if (formulae.length == 1 && formulae[0].toLowerCase() != "4df")
    showFormulae = true;
  if (formulae.indexOf("4dF") == -1 && formulae.indexOf("4df") == -1)
    formulae.push("4df");
}
let formulaeContent = "";
if (showFormulae) {
  formulaeContent = `<tr><td>${game.i18n.localize("fate-core-official.diceFormula")}:</td><td><select style="background-color:white" type="text" id="fco-gmadhr-formula">`;
  for (let formula of formulae)
    formulaeContent += `<option value="${formula}">${formula}</option>`;
  formulaeContent += `</select></td></tr>`;
}

// Создаем HTML-содержимое для диалогового окна
let content = `<table style="border:none;">
${formulaeContent}
<tr><td>${game.i18n.localize("fate-core-official.fu-adhoc-roll-actor-name")}</td><td><input style="background-color:white" type="text" id="fco-gmadhr-name"></input></td></tr>
<tr><td>${game.i18n.localize("fate-core-official.fu-adhoc-roll-skill-name")}</td><td><input style="background-color:white" type="text" id="fco-gmadhr-skill"></input></td></tr>
<tr><td>${game.i18n.localize("fate-core-official.fu-adhoc-roll-modifier")}</td><td><input style="background-color:white" type="number" id="fco-gmadhr-modifier"></input></td></tr>
<tr><td>${game.i18n.localize("fate-core-official.fu-adhoc-roll-description")}</td><td><input style="background-color:white" type="text" id="fco-gmadhr-flavour"></input></td></tr>
</tr></table>`;
let width = 400;
let height = 230;
if (showFormulae) height = 270;

// Создаем и отображаем диалог
new Dialog(
  {
    title: game.i18n.localize("fate-core-official.fu-adhoc-roll"),
    content: content,
    buttons: {
      ok: {
        label: game.i18n.localize("fate-core-official.OK"),
        callback: async () => {
          // Получаем данные из формы
          let formula = $("#fco-gmadhr-formula")[0]?.value;
          if (!formula) formula = "4df";
          name = $("#fco-gmadhr-name")[0].value;
          if (!name)
            name = game.i18n.localize(
              "fate-core-official.fu-adhoc-roll-mysteriousEntity",
            );
          skill = $("#fco-gmadhr-skill")[0].value;
          if (!skill)
            skill = game.i18n.localize(
              "fate-core-official.fu-adhoc-roll-mysteriousSkill",
            );
          modifier = $("#fco-gmadhr-modifier")[0].value;
          if (!modifier) modifier = 0;
          flavour = $("#fco-gmadhr-flavour")[0].value;
          if (!flavour)
            flavour = game.i18n.localize(
              "fate-core-official.fu-adhoc-roll-mysteriousReason",
            );

          // Выполняем бросок
          let r = new Roll(`${formula} + ${modifier}`);
          let roll = await r.roll();
          // Эта строка важна для анимации кубов (например, Dice So Nice!)
          roll.dice[0].options.sfx = { id: "fate4df", result: roll.result };
          roll.options.fco_formula = formula;

          // Создаем "пустого" спикера, чтобы имя было из формы
          let msg = ChatMessage.getSpeaker(game.user);
          msg.scene = null;
          msg.token = null;
          msg.actor = null;
          msg.alias = name;

          // Отправляем результат в чат
          roll.toMessage({
            flavor: `<h1>${skill}</h1>${formula} ${game.i18n.localize("fate-core-official.RolledBy")}: ${game.user.name}<br>
                                    Skill Rank & Modifiers: ${modifier} <br>Description: ${flavour}`,
            speaker: msg,
          });
        },
      },
    },
    default: "ok",
  },
  {
    width: width,
    height: height,
  },
).render(true);
