const boardColors = {
  red: [255, 0, 0],
  blue: [0, 255, 213],
  green: [149, 255, 0],
  orange: [230, 89, 0],
  black: [0, 0, 0],
  white: [255, 255, 255],
};
boardColors[-1] = boardColors.black;
boardColors[0] = boardColors.red;
boardColors[1] = boardColors.green;
boardColors[2] = boardColors.orange;
boardColors[3] = boardColors.blue;

export default class AnimationService {
  constructor(bluetoothService) {
    this.bluetoothService = bluetoothService;
    this.animations = [];
  }

  initBoard() {
    this.removeConditionalAnimations();
    this.animate();
  }

  takeFieldAnimation(fields, takenField, playerOnMove) {
    this.removeConditionalAnimations();
    let currentFields;
    for (let i = 0; i < 9; i += 1) {
      switch (i) {
        case 0:
          currentFields = [(takenField + 8) % 16];
          break;
        case 8:
          currentFields = [takenField];
          break;
        default:
          currentFields = [
            (takenField + 8 + i) % 16,
            (takenField + 8 - i) % 16,
          ];
          break;
      }
      if (i < 8) {
        currentFields.forEach((currentField) => {
          this.addAnimation(
            [currentField],
            [...boardColors[fields[currentField]], 0, 0, 0, 0, 0, 0],
            [10, i * 150 + 10, 2000 - 150 * i],
            1
          );
        });
      } else {
        this.animate();
        currentFields.forEach((currentField) => {
          this.addAnimation(
            [currentField],
            [
              ...boardColors[playerOnMove],
              ...boardColors[fields[currentField]],
            ],
            [10, 800],
            1
          );
        });
      }
    }
    this.animate();
  }

  addSpecialAnimation(index, params = []) {
    let animationString = index.toString();
    if (params) {
      animationString += "|" + params.join(",");
    }
    this.animations.push(animationString);
    this.animate();
  }

  removeSpecialAnimation() {
    this.addSpecialAnimation(-1);
    this.animate();
  }

  addAnimation(
    fields,
    colors,
    duration,
    repeat,
    fieldConditions,
    buttonConditions
  ) {
    let conditionalAnimation = "";
    if (fieldConditions && buttonConditions) {
      conditionalAnimation =
        "|" + fieldConditions.join(",") + "|" + buttonConditions.join(",");
    }
    if (fields.length > 0) {
      this.animations.push(
        `${fields.join(",")}|${colors.join(",")}|${duration.join(
          ","
        )}|${repeat}${conditionalAnimation}`
      );
    }
  }

  removeConditionalAnimations() {
    const boardFields = [...Array(16).keys()];
    const fieldConditions = new Array(16).fill(-1);
    const buttonConditions = new Array(20).fill(-1);
    this.addAnimation(
      boardFields,
      [0, 0, 0],
      [1000],
      -1,
      fieldConditions,
      buttonConditions
    );
    this.animate();
  }

  animate(debug = false) {
    if (this.animations.length > 0) {
      const animation = "#" + this.animations.join("#") + "#";
      if (debug) {
        console.log(animation);
      }
      this.bluetoothService.write("leds", animation);
      this.animations = [];
    }
  }
}
