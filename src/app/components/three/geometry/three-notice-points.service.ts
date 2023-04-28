import { Injectable } from "@angular/core";
import { SceneService } from "../scene.service";
import { InputNodesService } from "../../../components/input/input-nodes/input-nodes.service";
import { InputNoticePointsService } from "../../../components/input/input-notice-points/input-notice-points.service";
import { InputMembersService } from "../../../components/input/input-members/input-members.service";
import { ThreeNodesService } from "./three-nodes.service";
import * as THREE from "three";
import { CSS2DObject } from "../libs/CSS2DRenderer.js";
import { Vector3 } from "three";
import { ThreeMembersService } from "./three-members.service";

@Injectable({
  providedIn: "root",
})
export class ThreeNoticePointsService {

  private geometry: THREE.CylinderBufferGeometry;

  public maxDistance: number;
  public minDistance: number;

  private noticePointList: THREE.Object3D;
  private axisList: THREE.Group[]; // 軸は、メンバーのスケールと関係ないので、分けて管理する
  private selectionItem: THREE.Object3D; // 選択中のアイテム
  private currentIndex: string;

  // 大きさを調整するためのスケール
  private scale: number;
  private params: any; // GUIの表示制御
  private gui: any;

  private objVisible: boolean;
  private txtVisible: boolean;

  constructor( private scene: SceneService,
              private nodeThree: ThreeNodesService,
              private node: InputNodesService,
              private noticePoint: InputNoticePointsService,
              private member: InputMembersService,
              private memberThree: ThreeMembersService) {

    // this.geometry = new THREE.CylinderBufferGeometry();
    this.noticePointList = new THREE.Object3D();
    // this.axisList = new Array();
    this.ClearData();
    this.scene.add(this.noticePointList);
    // this.currentIndex = null;

    this.objVisible = true;
    // this.txtVisible = false;

    // gui
    // this.scale = 100;
    // this.params = {
    //   memberNo: this.txtVisible,
    //   memberScale: this.scale,
    // };
    // this.gui = null;
  }

  // 初期化
  public OnInit(): void {
    // 部材番号の表示を制御する gui を登録する
    // this.scene.gui.add(this.params, "memberNo").onChange((value) => {
    //   for (const mesh of this.memberList.children) {
    //     mesh.getObjectByName("font").visible = value;
    //   }
    //   this.txtVisible = value;
    //   this.scene.render();
    // });

  }

  // 要素の太さを決定する基準値
  public baseScale(): number {
    // const scale = this.nodeThree.baseScale;
    return 1;// scale * 0.3;
  }

  // データが変更された時の処理
  public changeData(): void {
    
    // 格点データを入手
    const nodeData = this.node.getNodeJson(0);
    if (Object.keys(nodeData).length <= 0) {
      return;
    }

    // メンバーデータを入手
    const memberData = this.member.getMemberJson(0);
    if (Object.keys(memberData).length <= 0) {
      return;
    }

    // 着目点情報を入手
    const jsonData = this.noticePoint.getNoticePointsJson();
    if (Object.keys(jsonData).length <= 0) {
      return;
    }

    // 新しい入力を適用する
    // for (const key of jsonKeys) {

    // }
    // this.onResize();
  }

  //シートの選択行が指すオブジェクトをハイライトする
  public selectChange(index): void{

    // if (this.currentIndex === index){
    //   //選択行の変更がないとき，何もしない
    //   return
    // }
    const jsonData = this.noticePoint.getNoticePointsJson();
    if (Object.keys(jsonData).length <= 0) {
      return;
    }
    const target = jsonData.find( (e) => e.row === index );
    const m_no = (target !== undefined) ? target.m: '0';
    this.memberThree.selectChange_points(m_no);

    // const axisKey_list = [];

    //全てのハイライトを元に戻し，選択行のオブジェクトのみハイライトを適応する
    // for (let item of this.memberList.children){
    //   item['material']['color'].setHex(0X000000);
    //   if( mode === "elements"){
    //     if (item['element'] === 'element' + index.toString()){
    //       item['material']['color'].setHex(0XFF0000);
    //       // ハイライトした部材の名称を保存しておく
    //       axisKey_list.push(item.name + 'axis'); 
    //     }
    //   } else {
    //     if (item.name === 'member' + index.toString()){
    //       item['material']['color'].setHex(0XFF0000);
    //     }
    //   }
    // }

    // this.scene.render();

    this.scene.render();
  }

  // データをクリアする
  public ClearData(): void {
    // 線を削除する
    // for (const mesh of this.memberList.children) {
    //   // 文字を削除する
    //   while (mesh.children.length > 0) {
    //     const object = mesh.children[0];
    //     object.parent.remove(object);
    //   }
    //   this.scene.remove(mesh);
    // }
    // this.memberList.children = new Array();

    // ローカル座標を示す線を削除する
    // for (const group of this.axisList) {
    //   this.scene.remove(group);
    // }
    // this.axisList = new Array();

    // this.minDistance = Number.MAX_VALUE;
    // this.maxDistance = 0;
  }

  // スケールを反映する
  private onResize(): void {

    // let sc = this.scale / 100; // this.scale は 100 が基準値なので、100 のとき 1 となるように変換する
    // sc = Math.max(sc, 0.001); // ゼロは許容しない

    // let scale: number = this.baseScale() * sc;
  
    // for (const item of this.memberList.children) {
    //   item.scale.set(scale, 1, scale);
    // }
    // scale *= 50 ;
    // for (const arrows of this.axisList) {
    //   for (const item of arrows.children) {
    //     item.scale.set(scale, scale, scale);
    //   }
    // }
  }

  // 表示設定を変更する
  public visibleChange(flag: boolean, text: boolean, gui: boolean): void {

    // this.selectChange(-1);

    // 表示設定
    // if (this.objVisible !== flag) {
    //   this.memberList.visible = flag;
    //   this.objVisible = flag;
    // }

    // 部材軸の表示設定
    // if (text === false) {
    //   // テキストが非表示なら部材軸の表示も消す
    //   for (const group of this.axisList) {
    //     group.visible = false;
    //   }
    // }

    // guiの表示設定
    // if (gui === true) {
    //   this.guiEnable();
    // } else {
    //   // 黒に戻す
    //   this.selectionItem = null;
    //   this.memberList.children.map((item) => {
    //     // 元の色にする
    //     const material = item['material'];
    //     material["color"].setHex(0x000000);
    //     material["opacity"] = 1.0;
    //   });
    //   this.axisList.map((item) => {
    //     item.visible = false;
    //   });
    //   this.guiDisable();
    // }
  }

  // guiを表示する
  private guiEnable(): void {
    // if (this.gui !== null) {
    //   return;
    // }

    // this.gui = this.scene.gui
    //   .add(this.params, "memberScale", 0, 1000)
    //   .step(1)
    //   .onChange((value) => {
    //     this.scale = value;
    //     this.onResize();
    //     this.scene.render();
    //   });
  }

  // guiを非表示にする
  private guiDisable(): void {
    // if (this.gui === null) {
    //   return;
    // }
    // this.scene.gui.remove(this.gui);
    // this.gui = null;
  }

  // マウス位置とぶつかったオブジェクトを検出する
  public detectObject(raycaster: THREE.Raycaster, action: string): void {
    
    // if (this.memberList.children.length === 0) {
    //   return; // 対象がなければ何もしない
    // }

    // 交差しているオブジェクトを取得
    // const intersects = raycaster.intersectObjects(this.memberList.children);
    // if ( intersects.length <= 0 ){
    //   return;
    // }

    // switch (action) {
    //   case "click":
    //     this.memberList.children.map((item) => {
    //       if (intersects.length > 0 && item === intersects[0].object) {
    //         // 色を赤くする
    //         const material = item['material'];
    //         material["color"].setHex(0xff0000);
    //         material["opacity"] = 1.0;
    //       }
    //     });
    //     break;

    //   case "select":
    //     if (intersects.length > 0) {
    //       this.selectionItem = null;
    //       this.memberList.children.map((item) => {
    //         const material = item['material'];
    //         if (item === intersects[0].object) {
    //           // 色を赤くする
    //           material["color"].setHex(0xff0000);
    //           material["opacity"] = 1.0;
    //           this.selectionItem = item;
    //         } else {
    //           // それ以外は元の色にする
    //           material["color"].setHex(0x000000);
    //           material["opacity"] = 1.0;
    //         }
    //       });
    //       // 選択されたアイテムの軸を表示する
    //       if (this.selectionItem !== null) {
    //         this.axisList.map((item) => {
    //           const key: string = this.selectionItem.name + "axis";
    //           if (item.name === key) {
    //             item.visible = true;
    //           } else {
    //             item.visible = false;
    //           }
    //         });
    //       }
    //     }
    //     break;

    //   case "hover":
    //     this.memberList.children.map((item) => {
    //       const material = item['material'];
    //       if (intersects.length > 0 && item === intersects[0].object) {
    //         // 色を赤くする
    //         material["color"].setHex(0xff0000);
    //         material["opacity"] = 0.25;
    //       } else {
    //         if (item === this.selectionItem) {
    //           material["color"].setHex(0xff0000);
    //           material["opacity"] = 1.0;
    //         } else {
    //           // それ以外は元の色にする
    //           material["color"].setHex(0x000000);
    //           material["opacity"] = 1.0;
    //         }
    //       }
    //     });
    //     break;

    //   default:
    //     return;
    // }
    // this.scene.render();
  }

}
