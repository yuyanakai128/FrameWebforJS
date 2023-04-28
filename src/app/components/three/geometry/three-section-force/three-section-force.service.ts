import { Injectable } from "@angular/core";
import * as THREE from "three";

import { SceneService } from "../../scene.service";
import { DataHelperModule } from "../../../../providers/data-helper.module";

import { InputNodesService } from "../../../input/input-nodes/input-nodes.service";
import { InputMembersService } from "../../../input/input-members/input-members.service";

import { ThreeMembersService } from "../three-members.service";
import { ThreeNodesService } from "../three-nodes.service";
import { ThreeSectionForceMeshService } from "./three-force-mesh";
import { ThreeService } from "../../three.service";
import { MaxMinService } from "../../max-min/max-min.service";

@Injectable({
  providedIn: "root",
})
export class ThreeSectionForceService {
  private ThreeObject1: THREE.Object3D;
  private ThreeObject2: THREE.Object3D;
  private currentIndex: string;
  private currentMode: string;
  public currentRadio: string;

  private scale: number;
  private textCount: number; // 文字を出力する数
  private params: any; // GUIの表示制御
  private radioButtons3D = [
    "axialForce",
    "shearForceY",
    "shearForceZ",
    "torsionalMoment",
    "momentY",
    "momentZ",
  ];
  private radioButtons2D = ["axialForce", "shearForceY", "momentZ"];
  private radioButtons = this.radioButtons3D || this.radioButtons2D;
  private gui: any;
  private gui_dimension: number = null;

  private mesh: ThreeSectionForceMeshService;

  public max: number;
  public min: number;

  private nodeData: any;
  private memberData: any;
  private fsecData = { fsec: null, comb_fsec: null, pick_fsec: null };
  private max_values = { fsec: null, comb_fsec: null, pick_fsec: null };
  public value_ranges = { fsec: null, comb_fsec: null, pick_fsec: null };

  constructor(
    private scene: SceneService,
    private max_min: MaxMinService,
    private helper: DataHelperModule,
    private node: InputNodesService,
    private member: InputMembersService,
    private three_node: ThreeNodesService,
    private three_member: ThreeMembersService
  ) {
    this.ThreeObject1 = new THREE.Object3D();
    this.ThreeObject1.visible = false; // 呼び出されるまで非表示
    this.ThreeObject2 = new THREE.Object3D();
    this.ThreeObject2.visible = false; // 呼び出されるまで非表示

    // フォントをロード
    const loader = new THREE.FontLoader();
    loader.load("./assets/fonts/helvetiker_regular.typeface.json", (font) => {
      this.mesh = new ThreeSectionForceMeshService(font);
      this.ClearData();
      this.scene.add(this.ThreeObject1);
      this.scene.add(this.ThreeObject2);
    });

    // gui
    this.scale = 100;
    this.textCount = 15; // 上位 15% の文字だけ出力する
    this.gui = null;
  }

  public visibleChange(ModeName: string): void {
    if (this.currentMode === ModeName) {
      return;
    }
    this.currentMode = ModeName;
    if (ModeName.length === 0) {
      this.ThreeObject1.visible = false;
      this.ThreeObject2.visible = false;
      this.guiDisable();
      return;
    }

    this.guiEnable();
    this.changeMesh();
    this.onResize();
  }

  // データをクリアする
  public ClearData(): void {
    for (const children of [
      this.ThreeObject1.children,
      this.ThreeObject2.children,
    ]) {
      for (const mesh of children) {
        // 文字を削除する
        let text: any = mesh.getObjectByName("text");
        while (text !== undefined) {
          mesh.remove(text);
          // text.dispose();
          text = mesh.getObjectByName("text");
        }
        // 文字以外の子要素を削除する
        while (mesh.children.length > 0) {
          const object = mesh.children[0];
          object.parent.remove(object);
        }
      }
    }

    // オブジェクトを削除する
    this.ThreeObject1.children = new Array();
    this.ThreeObject2.children = new Array();
  }

  private setGuiParams(): void {
    if (this.gui !== null && this.gui_dimension === this.helper.dimension) {
      return;
    }

    this.gui_dimension = this.helper.dimension;

    if (this.helper.dimension === 3) {
      this.radioButtons = this.radioButtons3D;
    } else {
      this.radioButtons = this.radioButtons2D;
    }
    this.params = {
      forceScale: this.scale,
      textCount: this.textCount,
    };
    for (const key of this.radioButtons) {
      this.params[key] = false;
    }

    if (this.helper.dimension === 3) {
      this.params.momentY = true; // 初期値（3D）
      this.currentRadio = "momentY";
    } else {
      this.params.momentZ = true; // 初期値（2D）
      this.currentRadio = "momentZ";
    }
  }

  private guiEnable(): void {
    if (this.gui !== null && this.gui_dimension === this.helper.dimension) {
      return;
    }

    const gui_step: number = 1;
    const gui_max_scale: number = 1000;

    this.gui = {
      forceScale: this.scene.gui
        .add(this.params, "forceScale", 0, gui_max_scale)
        .step(gui_step)
        .onChange((value) => {
          // guiによる設定
          this.scale = value;
          this.onResize();
          this.scene.render();
        }),
    };

    // this.gui['textCount'] = this.scene.gui.add(this.params, 'textCount', 0, 100).step(10).onFinishChange((value) => {
    //   // guiによる設定
    //   this.textCount = value;
    //   this.changeMesh();
    //   this.onResize();
    //   this.scene.render();
    // });

    for (const key of this.radioButtons) {
      this.gui[key] = this.scene.gui
        .add(this.params, key, this.params[key])
        .listen()
        .onChange((value) => {
          if (value === true) {
            this.setGuiRadio(key);
          } else {
            this.setGuiRadio("");
          }
          this.changeMesh();
          const key1: string =
          ( key === 'axialForce' || key === 'torsionalMorment' ) ? 'x' :
          ( key === 'shearForceY' || key === 'momentY' ) ? 'y' : 'z';
          this.max_min._getMaxMinValue(
            this.value_ranges[this.currentMode][this.currentIndex][key1], 
            'fsec',
            this.currentRadio
          );
          this.onResize();
          this.scene.render();
        });
    }
  }

  private guiDisable(): void {
    if (this.gui === null) {
      return;
    }
    for (const key of Object.keys(this.gui)) {
      this.scene.gui.remove(this.gui[key]);
    }
    this.gui = null;
  }

  public changeRadioButtons(check) {
    for (const key of this.radioButtons) {
      if (key === check) {
        this.params[key] = true;
      } else {
        this.params[key] = false;
      }
    }
    this.changeMesh();
    this.onResize();
    this.scene.render();
  }

  // gui 選択されたチェックボックス以外をOFFにする
  private setGuiRadio(target: string): void {
    for (const key of this.radioButtons) {
      this.params[key] = false;
    }
    this.params[target] = true;
  }

  // 解析結果をセットする
  public setResultData(fsecJson: any, max_values: any, value_ranges: any): void {
    const keys = Object.keys(fsecJson);
    if (keys.length === 0) {
      this.ClearData();
      return;
    }

    this.nodeData = this.node.getNodeJson(0);
    this.memberData = this.member.getMemberJson(0);
    this.fsecData.fsec = fsecJson;
    this.max_values.fsec = max_values;
    this.value_ranges.fsec = value_ranges;
    this.currentMode = "fsec";
    this.currentIndex = keys[0];
    this.changeMesh();
    this.ThreeObject1.visible = false; // 呼び出されるまで非表示
    this.ThreeObject2.visible = false; // 呼び出されるまで非表示
    this.currentMode = "";
  }
  // combine
  public setCombResultData(fsecJson: any, max_values: any, value_range: any): void {
    this.fsecData.comb_fsec = fsecJson;
    this.max_values.comb_fsec = max_values;
    this.value_ranges.comb_fsec = value_range;
  }
  // pick up
  public setPickupResultData(fsecJson: any, max_values: any, value_range: any): void {
    this.fsecData.pick_fsec = fsecJson;
    this.max_values.pick_fsec = max_values;
    this.value_ranges.pick_fsec = value_range;
  }

  private changeMesh(): void {
    if (this.currentIndex === undefined) {
      return;
    }

    this.setGuiParams();

    let key1: string;
    let key2: string;
    if (this.params.axialForce === true) {
      this.currentRadio = "axialForce";
      key1 = "fx";
      key2 = this.helper.dimension === 3 ? "z" : "y";
    } else if (this.params.torsionalMoment === true) {
      // ねじり曲げモーメント
      this.currentRadio = "torsionalMoment";
      key1 = "mx";
      key2 = "z";
    } else if (this.params.shearForceY === true) {
      // Y方向のせん断力
      this.currentRadio = "shearForceY";
      key1 = "fy";
      key2 = "y";
    } else if (this.params.momentY === true) {
      // Y軸周りの曲げモーメント
      this.currentRadio = "momentY";
      key1 = "my";
      key2 = "z";
    } else if (this.params.shearForceZ === true) {
      // Z方向のせん断力
      this.currentRadio = "shearForceZ";
      key1 = "fz";
      key2 = "z";
    } else if (this.params.momentZ === true) {
      // Z軸周りの曲げモーメント
      this.currentRadio = "momentZ";
      key1 = "mz";
      key2 = "y";
    } else {
      this.params[this.currentRadio] = true;
      this.changeMesh();
      return;
    }

    // 最初のケースを代表として描画する
    if (!(this.currentMode in this.fsecData)) {
      this.ThreeObject1.visible = false;
      this.ThreeObject2.visible = false;
      this.guiDisable();
      return;
    }

    const fsecList = this.fsecData[this.currentMode];
    if (!(this.currentIndex in fsecList)) {
      this.ThreeObject1.visible = false;
      this.ThreeObject2.visible = false;
      this.guiDisable();
      return;
    }

    /* if (this.gui === null) {
      this.guiEnable();
    } */

    const fsecDatas = [];
    const f = fsecList[this.currentIndex];
    let flg = false;
    for (const k of [key1 + "_max", key1 + "_min"]) {
      if (k in f) {
        fsecDatas.push(f[k]);
        flg = true;
      }
    }
    if (flg === false) {
      fsecDatas.push(f);
      this.ThreeObject1.visible = true;
      this.ThreeObject2.visible = false;
    } else {
      this.ThreeObject1.visible = true;
      this.ThreeObject2.visible = true;
    }

    const ThreeObjects: THREE.Object3D[] = [
      this.ThreeObject1,
      this.ThreeObject2,
    ];

    const textValues = [];
    for (let i = 0; i < fsecDatas.length; i++) {
      const fsecData = fsecDatas[i];
      const ThreeObject = ThreeObjects[i];

      // オブジェクト方が多い場合、データとオブジェクトの数を合わせる
      for (let i = fsecData.length + 1; i < ThreeObject.children.length; i++) {
        ThreeObject.children.splice(0, 1);
      }

      let nodei: THREE.Vector3;
      let nodej: THREE.Vector3;
      let localAxis: any;
      let len: number;
      let L1: number = 0;
      let L2: number = 0;
      let P1: number = 0;
      let P2: number = 0;
      let counter = 0;
      for (const fsec of fsecData) {
        const id = fsec["m"].trim();
        if (id.length > 0) {
          // 節点データを集計する
          const m = this.memberData[id];
          const ni = this.nodeData[m.ni];
          const nj = this.nodeData[m.nj];
          nodei = new THREE.Vector3(ni.x, ni.y, ni.z);
          nodej = new THREE.Vector3(nj.x, nj.y, nj.z);
          // 部材の座標軸を取得
          localAxis = this.three_member.localAxis(
            ni.x,
            ni.y,
            ni.z,
            nj.x,
            nj.y,
            nj.z,
            m.cg
          );
          len = new THREE.Vector3(
            nj.x - ni.x,
            nj.y - ni.y,
            nj.z - ni.z
          ).length();
          L1 = 0;
          P1 = fsec[key1];
          textValues.push(P1);
        } else {
          let item = null;
          if (ThreeObject.children.length > counter) {
            item = ThreeObject.children[counter];
          }
          const LL = fsec["l"];
          P2 = fsec[key1] - 0;
          textValues.push(P2);
          L2 = Math.round((len - LL) * 1000) / 1000;
          if (item === null) {
            const mesh = this.mesh.create(
                    nodei,
                    nodej,
                    localAxis,
                    key2,
                    L1,
                    L2,
                    P1,
                    P2
                  );
            ThreeObject.add(mesh);
          } else {
              this.mesh.change(
                item,
                nodei,
                nodej,
                localAxis,
                key2,
                L1,
                L2,
                P1,
                P2
              );
          }
          P1 = P2;
          L1 = LL;
          counter++;
        }
      }
    }

    // 主な点に文字を追加する
    // if(this.helper.dimension === 3) return;
    // 断面力の大きい順に並び変える
    textValues.sort((a, b) => {
      return Math.abs(a) < Math.abs(b) ? 1 : -1;
    });

    // 上位、下位の順位の数値を選出する
    const targetValues = Array.from(new Set(textValues));
    this.max = targetValues[0];
    this.min = targetValues[targetValues.length - 1];
    const count = Math.floor(textValues.length * (this.textCount / 100));
    let Upper = targetValues;
    if (count < targetValues.length) {
      Upper = targetValues.slice(1, count);
    }
    const targetList = Array.from(new Set(Upper));

    for (let i = 0; i < ThreeObjects.length; i++) {
      const ThreeObject = ThreeObjects[i];
      if (ThreeObject.visible === false) {
        continue; // 非表示の ThreeObject の文字は追加しない
      }
      for (const mesh of ThreeObject.children) {
        let f1 = false;
        if (targetList.find((v) => v === mesh["P1"]) !== undefined) {
          f1 = true;
        }
        let f2 = false;
        if (targetList.find((v) => v === mesh["P2"]) !== undefined) {
          f2 = true;
        }
        this.mesh.setText(mesh, f1, f2);
      }
    }
  }

  // データが変更された時に呼び出される
  // 変数 this.targetData に値をセットする
  public changeData(index: number, ModeName: string): void {
    this.currentIndex = index.toString();
    this.currentMode = ModeName;
    if (this.gui === null) {
      this.guiEnable();
    }
    this.changeMesh();
    this.onResize();
  }

  private baseScale(): number {
    return this.three_node.baseScale * 5;
  }

  // 断面力図を描く
  private onResize(): void {
    if (!(this.currentMode in this.max_values)) {
      return;
    }

    const scale1: number = this.scale / 100;
    const scale2: number = this.baseScale();
    const max_values = this.max_values[this.currentMode];
    if (!(this.currentIndex in max_values)) {
      return;
    }
    const max_value = max_values[this.currentIndex];
    if (max_value === undefined) {
      return;
    }

    let scale3: number = 1;
    if (this.params.axialForce === true) {
      scale3 = max_value["fx"];
    } else if (this.params.torsionalMoment === true) {
      // ねじり曲げモーメント
      scale3 = max_value["mx"];
    } else if (this.params.shearForceY === true) {
      // Y方向のせん断力
      scale3 = max_value["fy"];
    } else if (this.params.momentY === true) {
      // Y軸周りの曲げモーメント
      scale3 = max_value["my"];
    } else if (this.params.shearForceZ === true) {
      // Z方向のせん断力
      scale3 = max_value["fz"];
    } else if (this.params.momentZ === true) {
      // Z軸周りの曲げモーメント
      scale3 = max_value["mz"];
    } else {
      return;
    }

    const scale: number = (scale1 * scale2) / scale3;

    if (this.ThreeObject1.visible === true) {
      this.ThreeObject1.children.forEach((item) => {
        this.mesh.setScale(item, scale);
      });
    }
    if (this.ThreeObject2.visible === true) {
      this.ThreeObject2.children.forEach((item) => {
        this.mesh.setScale(item, scale);
      });
    }
  }
}
