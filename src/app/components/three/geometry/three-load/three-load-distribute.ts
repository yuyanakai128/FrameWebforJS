import { Injectable } from "@angular/core";
import * as THREE from "three";
import { Vector2, Vector3 } from "three";

import { ThreeLoadDimension } from "./three-load-dimension";
import { ThreeLoadText } from "./three-load-text";

@Injectable({
  providedIn: "root",
})
export class ThreeLoadDistribute {
  static id = 'DistributeLoad';
  public id = ThreeLoadDistribute.id;

  private face_mat_Red: THREE.MeshBasicMaterial;
  private face_mat_Green: THREE.MeshBasicMaterial;
  private face_mat_Blue: THREE.MeshBasicMaterial;

  private line_mat_Red: THREE.LineBasicMaterial;
  private line_mat_Green: THREE.LineBasicMaterial;
  private line_mat_Blue: THREE.LineBasicMaterial;
  private face_mat_Pick: THREE.MeshBasicMaterial
  private line_mat_Pick: THREE.LineBasicMaterial;
  
  private text: ThreeLoadText;
  private dim: ThreeLoadDimension;

  constructor(text: ThreeLoadText) {
    
    this.text = text;
    this.dim = new ThreeLoadDimension(text);
    
    this.face_mat_Red = new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      color: 0xff0000,
      opacity: 0.3,
    });
    this.face_mat_Green = new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      color: 0x00ff00,
      opacity: 0.3,
    });
    this.face_mat_Blue = new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      color: 0x0000ff,
      opacity: 0.3,
    });
    this.line_mat_Red = new THREE.LineBasicMaterial({ color: 0xff0000, vertexColors: true });
    this.line_mat_Green = new THREE.LineBasicMaterial({ color: 0x00ff00, vertexColors: true });
    this.line_mat_Blue = new THREE.LineBasicMaterial({ color: 0x0000ff, vertexColors: true });
    this.line_mat_Pick = new THREE.LineBasicMaterial({ color: 0xff0000, vertexColors: true });
    this.face_mat_Pick = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, side: THREE.DoubleSide, opacity: 0.3 });
  }



  /// 等分布荷重を編集する
  // target: 編集対象の荷重,
  // nodei: 部材始点,
  // nodej: 部材終点,
  // localAxis: 部材座標系
  // direction: 荷重の向き(wy, wz, wgx, wgy, wgz)
  // L1: 始点からの距離
  // L2: 終点からの距離
  // P1: 始点側の荷重値
  // P2: 終点側の荷重値
  // row: 対象荷重が記述されている行数
  // offset: 配置位置（その他の荷重とぶつからない位置）
  // scale: スケール
  public create(nodei: THREE.Vector3, nodej: THREE.Vector3, localAxis: any,
    direction: string, pL1: number, pL2: number, P1: number, P2: number,
    row: number): THREE.Group {

    const offset: number = 0;
    const height: number = 1;

    // 線の色を決める
    const my_color = this.getColor(direction);

    const child = new THREE.Group();

    // 長さを決める
    const p = this.getPoints(nodei, nodej, direction, pL1, pL2, P1, P2, height);
    const points: THREE.Vector3[] = p.points;

    // 面
    child.add(this.getFace(my_color, points));

    // 線
    child.add(this.getLine(my_color, points));

    // 全体
    child.name = "child";
    child.position.y = offset;

    const group0 = new THREE.Group();
    group0.add(child);
    group0.name = "group";

    const group = new THREE.Group();
    group.add(group0);
    group["points"] = p.points;
    group["L1"] = p.L1;
    group["L"] = p.L;
    group["L2"] = p.L2;
    group["P1"] = P1;
    group["P2"] = P2;
    group["nodei"] = nodei;
    group["nodej"] = nodej;
    group["direction"] = direction;
    group["localAxis"] = localAxis;
    group["editor"] = this;
    group["value"] = p.Pmax; // 大きい方の値を保存

    // 全体の向きを修正する
    this.setRotate(direction, group, localAxis);

    // 全体の位置を修正する
    this.setPosition(direction, group, nodei, nodej, P1, P2);

    // 例：DistributeLoad-3-y
    group.name = ThreeLoadDistribute.id + "-" + row.toString() + '-' + direction.toString(); 

    return group;
  }

  private getColor(direction: string): number {
    let my_color = 0xff0000;
    if (direction === "y" || direction === "gy") {
      my_color = 0x00ff00;
    } else if (direction === "z" || direction === "gz") {
      my_color = 0x0000ff;
    }
    return my_color;
  }

  // 座標
  private getPoints(
    nodei: THREE.Vector3,
    nodej: THREE.Vector3,
    direction: string,
    pL1: number,
    pL2: number,
    P1: number,
    P2: number,
    height: number
  ): any {
    // 2点間の距離を定義
    let len = nodei.distanceTo(nodej);

    // 絶対座標系荷重であれば距離変換を行う
    if (direction === "gx") {
      len = new THREE.Vector2(nodei.z, nodei.y).distanceTo(
        new THREE.Vector2(nodej.z, nodej.y)
      );
    } else if (direction === "gy") {
      len = new THREE.Vector2(nodei.x, nodei.z).distanceTo(
        new THREE.Vector2(nodej.x, nodej.z)
      );
    } else if (direction === "gz") {
      len = new THREE.Vector2(nodei.x, nodei.y).distanceTo(
        new THREE.Vector2(nodej.x, nodej.y)
      );
    }
    const L1: number = Number(pL1);
    const L2: number = pL2;
    const L: number = len - L1 - L2;

    // 荷重原点
    let y0 = 0;

    // 荷重の各座標
    let x1 = L1;
    let x3 = L1 + L;
    let x2 = (x1 + x3) / 2;

    // y座標 値の大きい方が１となる
    const Pmax = Math.abs(P1) > Math.abs(P2) ? P1 : P2;

    let bigP = Math.abs(Pmax);
    const y1 = (P1 / bigP) * height + y0;
    const y3 = (P2 / bigP) * height + y0;
    let y2 = (y1 + y3) / 2;

    const sg1 = Math.sign(P1);
    const sg2 = Math.sign(P2);
    if (sg1 !== sg2 && sg1 * sg2 !== 0) {
      const pp1 = Math.abs(P1);
      const pp2 = Math.abs(P2);
      x2 = (L * pp1) / (pp1 + pp2) + x1;
      y2 = 0;
    }

    return {
      points: [
        new THREE.Vector3(x1, y0, 0),
        new THREE.Vector3(x1, y1, 0),
        new THREE.Vector3(x2, y2, 0),

        new THREE.Vector3(x2, y2, 0),
        new THREE.Vector3(x3, y3, 0),
        new THREE.Vector3(x3, y0, 0),

        new THREE.Vector3(x1, y0, 0),
        new THREE.Vector3(x2, y2, 0),
        new THREE.Vector3(x3, y0, 0),
      ],
      L1,
      L,
      L2,
      Pmax,
    };
  }

  // 面
  private getFace(my_color: number, points: THREE.Vector3[]): THREE.Mesh {
    let face_mat: THREE.MeshBasicMaterial;
    if (my_color === 0xff0000) {
      face_mat = this.face_mat_Red;
    } else if (my_color === 0x00ff00) {
      face_mat = this.face_mat_Green;
    } else {
      face_mat = this.face_mat_Blue;
    }

    const face_geo = new THREE.BufferGeometry().setFromPoints( points )
    // const face_geo = new THREE.Geometry();
    // face_geo.vertices = points;

    // face_geo.faces.push(new THREE.Face3(0, 1, 2));
    // face_geo.faces.push(new THREE.Face3(2, 3, 4));
    // face_geo.faces.push(new THREE.Face3(0, 2, 4));

    const mesh = new THREE.Mesh(face_geo, face_mat);
    mesh.name = "face";
    return mesh;
  }

  // 枠線
  private getLine(my_color: number, points: THREE.Vector3[]): THREE.Line {
    let line_mat: THREE.LineBasicMaterial;
    if (my_color === 0xff0000) {
      line_mat = this.line_mat_Red;
    } else if (my_color === 0x00ff00) {
      line_mat = this.line_mat_Green;
    } else {
      line_mat = this.line_mat_Blue;
    }
    // const line_mat = new THREE.LineBasicMaterial({ color: my_color });
    const line_point = [
      points[0],
      points[1],
      points[4],
      points[5]
    ]
    const line_geo = new THREE.BufferGeometry().setFromPoints(line_point);
    const line = new THREE.Line(line_geo, line_mat);
    line.name = "line";

    return line;
  }

  // 大きさを反映する
  public setSize(group: any, scale: number): void {
    for (const item of group.children) {
      item.scale.set(1, scale, scale);
    }
  }
  // 大きさを反映する
  public setScale(group: any, scale: number): void {
    group.scale.set(1, scale, scale);
  }

  // オフセットを反映する
  public setOffset(group: THREE.Group, offset: number): void {
    for (const item of group.children) {
      item.position.y = offset;
    }
    group['offset'] = offset;
  }

  public setGlobalOffset(
    group: THREE.Group,
    offset: number,
    key: string
  ): void {
    for (const item of group.children) {
      item.position.y = offset;
    }
    group['offset'] = offset;
  }



  // ハイライトを反映させる
  public setColor(group: any, status: string): void {

    const group0 = group.getObjectByName('group');
    const child = group0.getObjectByName('child');

    let face_color = this.face_mat_Pick; //ハイライト用のカラー
    let line_color = this.line_mat_Pick;

    if (status === "clear") {
      //デフォルトのカラーに戻す
      const direction: string = group.name.slice(-1);
      if (direction === 'y') {
        face_color = this.face_mat_Green;
        line_color = this.line_mat_Green;
      } else if (direction === 'z') {
        face_color = this.face_mat_Blue;
        line_color = this.line_mat_Blue;
      }
    }

    // カラーの適用
    for (const target of child.children) {
      if (target.name === 'face') {
        target.material = face_color;
      } else if (target.name === 'line') {
        target.material = line_color;
      }
    }

    // 文字
    this.setText(group, status);
  

    // 寸法線
    this.setDim(group, status);

  }

  private setRotate( direction: string, group: any, 
    localAxis: { x:Vector3, y:Vector3, z:Vector3 }) {

    // 全体の向きを修正する
    if (!direction.includes("g")) {

      const XY = new Vector2(localAxis.x.x, localAxis.x.y).normalize();
      let A = Math.asin(XY.y)

      if (XY.x < 0) {
        A = Math.PI - A;
      }
      group.rotateZ(A);

      const lenXY = Math.sqrt(
        Math.pow(localAxis.x.x, 2) + Math.pow(localAxis.x.y, 2)
      );
      const XZ = new Vector2(lenXY, localAxis.x.z).normalize();
      group.rotateY(-Math.asin(XZ.y));

      if (localAxis.x.x === 0 && localAxis.x.y === 0) {
        // 鉛直の部材
        if (direction === "z") {
          group.rotateX(-Math.PI);
        } else if (direction === "y") {
          group.rotateX(Math.PI / 2);
        }
      } else {
        if (direction === "z") {
          group.rotateX(-Math.PI / 2);
        } else if (direction === "y") {
          group.rotateX(Math.PI);
        }
      }

    } else if (direction === "gx") {
      group.rotateZ(Math.PI / 2);
      group.rotation.x = (Math.atan( localAxis.x.z / localAxis.x.y ))
    } else if (direction === "gy") {
      group.rotateX(Math.PI);
      group.rotation.y = (Math.atan( localAxis.x.z / localAxis.x.x ))
    } else if (direction === "gz") {
      group.rotateX(-Math.PI / 2);
      group.rotation.y = (-Math.atan( localAxis.x.y / localAxis.x.x ))
    }

  }


  // 
  private setPosition(direction: string, group: any, 
                      nodei: Vector3, nodej: Vector3, 
                      P1: number, P2: number) {

    if (!direction.includes('g')) {
      group.position.set(nodei.x, nodei.y, nodei.z);
    } else if (direction === 'gx') {
      // nodeとPの関係によって、セットする位置(x座標)が異なる。
      if (P1 >= 0 && P2 >= 0) {
        if (nodei.x >= nodej.x) {
          group.position.set(nodej.x, nodei.y, nodei.z);
        } else {
          group.position.set(nodei.x, nodei.y, nodei.z);
        }
      } else {
        if (nodei.x >= nodej.x) {
          group.position.set(nodei.x, nodei.y, nodei.z);
        } else {
          group.position.set(nodej.x, nodei.y, nodei.z);
        }
      }
    } else if (direction === 'gy') {
      // nodeとPの関係によって、セットする位置(y座標)が異なる。
      if (P1 >= 0 && P2 >= 0) {
        if (nodei.y >= nodej.y) {
          group.position.set(nodei.x, nodej.y, nodei.z);
        } else {
          group.position.set(nodei.x, nodei.y, nodei.z);
        }
      } else {
        if (nodei.y >= nodej.y) {
          group.position.set(nodei.x, nodei.y, nodei.z);
        } else {
          group.position.set(nodei.x, nodej.y, nodei.z);
        }
      }
    } else if (direction === 'gz') {
      // nodeとPの関係によって、セットする位置(z座標)が異なる。
      if (P1 >= 0 && P2 >= 0) {
        if (nodei.z >= nodej.z) {
          group.position.set(nodei.x, nodei.y, nodej.z);
        } else {
          group.position.set(nodei.x, nodei.y, nodei.z);
        }
      } else {
        if (nodei.z >= nodej.z) {
          group.position.set(nodei.x, nodei.y, nodei.z);
        } else {
          group.position.set(nodei.x, nodei.y, nodej.z);
        }
      }
    }
  }

  // 文字
  private setText(group: any, status: string): void {
    
    // 一旦削除
    for(let i=0; i<2; i++){
      const key = 'P' + (i+1);
      const text = group.getObjectByName(key);
      if(text !== undefined){
        group.remove(text);
      }
    }

    if (status !== "select") {
      return;
    }

    const localAxis = group.localAxis;
    const points = group.points;
    const offset = group.offset;
    const pos = [points[1], points[4]];
    const vartical = ['bottom', 'top'];
    const direction = group.direction;
    for(let i=0; i<2; i++){
      const key = 'P' + (i+1);
      const value = Math.round(group[key]*100) / 100;
      if(value === 0){
        continue;
      }
      const textString: string = value.toFixed(2) + " kN/m";
      const text = this.text.create(textString, pos[i], 0.1, offset);
      const height = Math.abs(text.geometry.boundingBox.max.y - text.geometry.boundingBox.min.y);
      const width = Math.abs(text.geometry.boundingBox.max.x - text.geometry.boundingBox.min.x);
      if (vartical[i] === 'bottom') {
        text.position.x += 0.5 * height;
      } else {
        text.position.x -= 0.5 * height;
      }
      
      // 独自の回転処理
      // text.rotateX(Math.PI)
      text.rotateZ(Math.PI / 2)
      //this.setRotate(direction, text, localAxis, true);
      //if (direction === "z") text.rotateX(-Math.PI / 2);
      //if (localAxis.x.y !== 1 && localAxis.x.y !== -1) text.rotateZ(Math.PI/2);
      text.name = key;
      group.add(text);
    }
    
  }

  // 寸法線
  private setDim(group: any, status: string): void{
    
    const points: THREE.Vector3[] = group.points;
    const offset: number = group.offset;
    const L1: number = group.L1;
    const L: number = group.L;
    const L2: number = group.L2

    // 一旦削除
    const text = group.getObjectByName('Dimension');
    if(text !== undefined){
      group.remove(text);
    }

    if (status !== "select") {
      return;
    }

    const dim = new THREE.Group();

    let dim1: THREE.Group;
    let dim2: THREE.Group;
    let dim3: THREE.Group;
    let dim4: THREE.Group;

    const size: number = 0.1; // 文字サイズ

    const y1a = Math.abs(points[1].y);
    const y3a = Math.abs(points[4].y);
    const y4a = Math.max(y1a, y3a) + (size * 10);
    const a = (y1a > y3a) ? Math.sign(points[1].y) : Math.sign(points[4].y);
    const y4 = a * y4a;

    if(L1 > 0){
      const x0 = points[1].x - L1;
      const p = [
        new THREE.Vector2(x0, 0 + offset),
        new THREE.Vector2(x0, y4 + offset),
        new THREE.Vector2(points[1].x, y4 + offset),
        new THREE.Vector2(points[1].x, points[1].y + offset),
      ];
      dim1 = this.dim.create(p, L1.toFixed(3))
      dim1.visible = true;
      dim1.name = "Dimension1";
      dim.add(dim1);
    }

    const p = [
      new THREE.Vector2(points[1].x, points[1].y + offset),
      new THREE.Vector2(points[1].x, y4 + offset),
      new THREE.Vector2(points[4].x, y4 + offset),
      new THREE.Vector2(points[4].x, points[4].y + offset),
    ];
    dim2 = this.dim.create(p, L.toFixed(3))
    dim2.visible = true;
    dim2.name = "Dimension2";
    dim.add(dim2);

    if(L2 > 0){
      const x4 = points[4].x + L2;
      const p = [
        new THREE.Vector2(points[4].x, points[4].y + offset),
        new THREE.Vector2(points[4].x, y4 + offset),
        new THREE.Vector2(x4, y4 + offset),
        new THREE.Vector2(x4, 0 + offset),
      ];
      dim3 = this.dim.create(p, L2.toFixed(3))
      dim3.visible = true;
      dim3.name = "Dimension3";
      dim.add(dim3);
    }

    // 登録
    dim.name = "Dimension";

    group.add(dim);
    

  }
  


}
