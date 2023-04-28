import { Injectable } from '@angular/core';
import * as THREE from "three";
import { Vector2, Vector3 } from 'three';

import { ThreeLoadText } from "./three-load-text";
import { ThreeLoadDimension } from './three-load-dimension';
import { ThreeLoadMoment } from './three-load-moment';

@Injectable({
  providedIn: 'root'
})
export class ThreeLoadTorsion {
  
  static id = 'TorsionLoad';
  public id = ThreeLoadTorsion.id;

  private moment: ThreeLoadMoment;

  private cylinder_Red: THREE.MeshBasicMaterial;
  private cylinder_Blue: THREE.MeshBasicMaterial;
  private cylinder_Pick: THREE.MeshBasicMaterial;

  private text: ThreeLoadText;
  private dim: ThreeLoadDimension;

  constructor(text: ThreeLoadText) {
    
    this.text = text;
    this.dim = new ThreeLoadDimension(text);

    this.moment = new ThreeLoadMoment(text);
    this.cylinder_Red = new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      color: 0xff0000,
      opacity: 0.3,
    });
    this.cylinder_Blue = new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      color: 0x0000ff,
      opacity: 0.3,
    });
    this.cylinder_Pick = new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      color: 0xff00ff,
      opacity: 0.3,
    });

  }

  public create(
    nodei: THREE.Vector3,
    nodej: THREE.Vector3,
    localAxis: any,
    direction: string,
    pL1: number,
    pL2: number,
    P1: number,
    P2: number,
    row: number
  ): THREE.Group {

    const radius: number = 0.5;

    // 線の色を決める
    const my_color = this.getColor([P1, P2]);

    const child = new THREE.Group();

    // 長さを決める
    const p = this.getPoints(
      nodei, nodej, direction, pL1, pL2, P1, P2, radius);

    const points: THREE.Vector3[] = p.points;
    const L1 = p.L1;
    const L = p.L;
    const L2 = p.L2;

    // 面
    for (const mesh of this.getFace(my_color, points)) {
      child.add(mesh);
    }

    // 線
    for (const arrow of this.getArrow([P1, P2], my_color, [points[0], points[2]], row)) {
      child.add(arrow);
    }

    // 全体
    child.name = "child";

    const group = new THREE.Group();
    group.add(child);
    group["points"] = p.points;
    group["L1"] = L1;
    group["L"] = L;
    group["L2"] = L2;
    group["P1"] = P1;
    group["P2"] = P2;
    group["nodei"] = nodei;
    group["nodej"] = nodej;
    group["direction"] = direction;
    group["localAxis"] = localAxis;
    group["editor"] = this;
    group['value'] = p.Pmax; // 大きい方の値を保存　
    group.name = ThreeLoadTorsion.id;

    // 全体の向きを修正する
    this.setRotate(direction, group, localAxis);

    // 全体の位置を修正する
    this.setPosition(direction, group, nodei, nodej, P1, P2);

    // 例：TorsionLoad-3-r
    group.name = ThreeLoadTorsion.id + "-" + row.toString() + "-r";

    return group;
  }

  private getColor(target: number[]): number[] {
    const my_color = [];
    target.forEach(value => {
      my_color.push(
        (Math.sign(value) > 0 ? 0xff0000
          : Math.sign(value) < 0 ? 0x0000ff
            : 0x000000)
      );
    })
    if (my_color[0] === 0x000000 || my_color[1] === 0x000000) {
      if (my_color[0] === 0x000000) {
        my_color[0] = my_color[1];
      } else if (my_color[1] === 0x000000) {
        my_color[1] = my_color[0];
      }
    }
    return my_color;
  }

  // 座標
  private getPoints(
    nodei: THREE.Vector3,
    nodej: THREE.Vector3,
    direction: string,
    L1: number,
    L2: number,
    P1: number,
    P2: number,
    radius: number,
  ): any {

    const LL = nodei.distanceTo(nodej);

    const L: number = LL - L1 - L2;

    // 荷重の各座標
    let x1 = L1;
    let x3 = L1 + L;
    let x2 = (x1 + x3) / 2;

    // y座標 値の大きい方がradiusとなる
    const Pmax = (Math.abs(P1) > Math.abs(P2)) ? P1 : P2;
    let bigP = Math.abs(Pmax);
    const y1 = (P1 / bigP) * radius;
    const y3 = (P2 / bigP) * radius;
    let y2 = (y1 + y3) / 2;

    const sg1 = Math.sign(P1);
    const sg2 = Math.sign(P2);
    if (sg1 !== sg2 && sg1 * sg2 !== 0) {
      const pp1 = Math.abs(P1);
      const pp2 = Math.abs(P2);
      x2 = L * pp1 / (pp1 + pp2) + x1;
      y2 = 0;
    }

    return {
      points: [
        new THREE.Vector3(x1, y1, 0),
        new THREE.Vector3(x2, y2, 0),
        new THREE.Vector3(x3, y3, 0),
      ],
      L1,
      L,
      L2,
      Pmax
    };
  }

  // 面
  private getFace(
    my_color: number[], points: THREE.Vector3[]): THREE.Mesh[] {

    const result: THREE.Mesh[] = new Array();;

    for (let i = 0; i < my_color.length; i++) {

      const cylinder_mat = (my_color[i] === 0xff0000) ? this.cylinder_Red : this.cylinder_Blue;

      const height = points[i + 1].x - points[i].x;
      const cylinder_geo = new THREE.CylinderBufferGeometry(
        Math.abs(points[i].y), Math.abs(points[i + 1].y), height, // radiusTop, radiusBottom, height
        12, 1, true, // radialSegments, heightSegments, openEnded
        -Math.PI * 1/3, Math.PI * 1.5 // thetaStart, thetaLength
      );
      const mesh = new THREE.Mesh(cylinder_geo, cylinder_mat);
      mesh.rotation.z = Math.PI / 2;
      mesh.position.x = (height / 2) + points[i].x;

      mesh.name = (my_color[i] === 0xff0000) ? "mesh-" + (i + 1).toString() + '-red' : "mesh-" + (i + 1).toString() + '-blue';  //例：mesh-2-blue

      result.push(mesh);
    }

    return result;

  }

  // 矢印
  private getArrow(values: number[],
    my_color: number[], points: THREE.Vector3[], row: number): THREE.Group[] {

    const result: THREE.Group[] = new Array();;

    for (let i = 0; i < values.length; i++) {

      const arrow: THREE.Group = this.moment.create(
        new THREE.Vector3(points[i].x, 0, 0),
        0,
        values[i],
        Math.abs(points[i].y),
        "rx",
        row,
        my_color[i]
      );

      if (values[i] < 0) {
        arrow.rotation.set(-Math.PI / 2, 0, 0);
      }

      result.push(arrow);

    }
    return result;
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

  // ハイライトを反映させる
  public setColor(group: any, status: string) {

    for (let target of group.children[0].children) {
      if (status === "clear") {
        if (target.name.slice(-3) === 'red') {
          target.material = this.cylinder_Red;
        } else if (target.name.slice(-4) === 'blue') {
          target.material = this.cylinder_Blue;
        } else if (target.name.slice(-2) === 'rx') {
          //何もしない
        }
      } else if (status == "select") {
        if (target.name.slice(-3) === 'red') {
          target.material = this.cylinder_Pick; //ハイライト用のカラー
        } else if (target.name.slice(-4) === 'blue') {
          target.material = this.cylinder_Pick; //ハイライト用のカラー
        } else if (target.name.slice(-2) === 'rx') {
          //何もしない
        }
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
      group.rotation.z = Math.asin(-Math.PI / 2);
    } else if (direction === "gz") {
      group.rotation.x = Math.asin(-Math.PI / 2);
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
    //const offset = group.offset;
    //const pos = [points[0], points[0]];
    const pos = [new Vector2(points[0].x,-points[0].y), new Vector2(points[2].x,-points[2].y)];
    const vartical = ['bottom', 'top'];
    const direction = group.direction;
    for(let i=0; i<2; i++){
      const key = 'P' + (i+1);
      const value = Math.round(group[key]*100) / 100;
      if(value === 0){
        continue;
      }
      const textString: string = value.toFixed(2) + " kN･m";
      const text = this.text.create(textString, pos[i], 0.1);
      const height = Math.abs(text.geometry.boundingBox.max.y - text.geometry.boundingBox.min.y);
      const width = Math.abs(text.geometry.boundingBox.max.x - text.geometry.boundingBox.min.x);
      if (vartical[i] === 'bottom') {
        text.position.x += 0.5 * height;
      } else {
        text.position.x -= 0.5 * height;
      }
      text.position.y -= 0.5 * width;
      this.setRotate(direction, text, localAxis);
      text.rotateZ(Math.PI/2);
      text.name = key;
      group.add(text);
    }
    
  }

  // 寸法線
  private setDim(group: any, status: string): void {
    
    const points: THREE.Vector3[] = group.points;
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

    const size: number = 0.1; // 文字サイズ

    const y1a = Math.abs(points[0].y);
    const y3a = Math.abs(points[2].y);
    const y4a = Math.max(y1a, y3a) + (size * 10);
    const a = (y1a > y3a) ? Math.sign(points[0].y) : Math.sign(points[2].y);
    const y4 = a * y4a;

    if(L1 > 0){
      const x0 = points[0].x - L1;
      const p = [
        new THREE.Vector2(x0, 0),
        new THREE.Vector2(x0, y4),
        new THREE.Vector2(points[0].x, y4),
        new THREE.Vector2(points[0].x, points[0].y),
      ];
      dim1 = this.dim.create(p, L1.toFixed(3))
      dim1.visible = true;
      dim1.name = "Dimension1";
      dim.add(dim1);
    }

    const p = [
      new THREE.Vector2(points[0].x, points[0].y),
      new THREE.Vector2(points[0].x, y4),
      new THREE.Vector2(points[2].x, y4),
      new THREE.Vector2(points[2].x, points[2].y),
    ];
    dim2 = this.dim.create(p, L.toFixed(3))
    dim2.visible = true;
    dim2.name = "Dimension2";
    dim.add(dim2);

    if(L2 > 0){
      const x4 = points[2].x + L2;
      const p = [
        new THREE.Vector2(points[2].x, points[2].y),
        new THREE.Vector2(points[2].x, y4),
        new THREE.Vector2(x4, y4),
        new THREE.Vector2(x4, 0),
      ];
      dim3 = this.dim.create(p, L2.toFixed(3))
      dim3.visible = true;
      dim3.name = "Dimension3";
      dim.add(dim3);
    }

    dim.rotateX(Math.PI)

    // 登録
    dim.name = "Dimension";

    group.add(dim);

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

}
