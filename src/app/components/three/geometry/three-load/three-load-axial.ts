import { Injectable } from '@angular/core';
import * as THREE from "three";
import { Points, Vector2, Vector3 } from 'three';
import { ThreeLoadText } from './three-load-text';
import { ThreeLoadDimension } from './three-load-dimension';

@Injectable({
  providedIn: 'root'
})
export class ThreeLoadAxial {

  static id = 'AxialLoad';
  public id = ThreeLoadAxial.id;

  
  private matLine: THREE.LineBasicMaterial;
  private matLine_Pick: THREE.LineBasicMaterial;
  private arrow_mat: THREE.MeshBasicMaterial;
  private arrow_mat_Pick: THREE.MeshBasicMaterial;

  private text: ThreeLoadText;
  private dim: ThreeLoadDimension;

  constructor(text: ThreeLoadText) {
    
    this.text = text;
    this.dim = new ThreeLoadDimension(text);
    
    this.matLine = new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth: 0.001, // in pixels
      vertexColors: false, // true
    });
    this.matLine_Pick  = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      linewidth: 0.001, // in pixels
      vertexColors: false, // true
    });

    this.arrow_mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.arrow_mat_Pick = new THREE.MeshBasicMaterial({ color: 0x00ffff });
  }

  public create( nodei: THREE.Vector3, nodej: THREE.Vector3, localAxis: any,
    direction: string, L1: number, L2: number, P1: number, P2: number,
    row: number ): THREE.Group {

    const offset: number = 0.1;

    const child = new THREE.Group();

    const LL = nodei.distanceTo(nodej);
    const L: number = LL - L1 - L2;
    const value = P1;

    // 線を描く
    const points: THREE.Vector3[] = [];
    points.push(new THREE.Vector3(0, 0, 0));
    points.push(new THREE.Vector3(L, 0, 0));

    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    const line2 = new THREE.Line(geometry, this.matLine);
    line2.computeLineDistances();
    line2.position.x = L1;
    line2.name = 'line2';

    child.add(line2);

    // 矢印を描く
    const arrow_height = 0.25
    const arrow_geo = new THREE.ConeBufferGeometry(0.05, arrow_height, 3, 1, false);
    const arrow_child = new THREE.Mesh(arrow_geo, this.arrow_mat);
    if (value > 0) {
      arrow_child.position.x = -arrow_height / 2;
    } else {
      arrow_child.position.x = arrow_height / 2;
    }
    arrow_child.name = "arrow_child";

    const arrow = new THREE.Group();
    arrow.name = "arrow";
    arrow.add(arrow_child);

    if (value > 0) {
      arrow_child.rotation.z = -Math.PI / 2;
      arrow.position.x = L1 + L;
    } else {
      arrow_child.rotation.z = Math.PI / 2;
      arrow.position.x = L1;
    }

    child.add(arrow);
    child.name = "child";

    // 全体
    child.name = "child";
    child.position.y = offset;

    const group0 = new THREE.Group();
    group0.add(child);
    group0.name = "group";

    // 全体の位置を修正する
    const group = new THREE.Group();
    group.add(group0);
    group["points"] = points;
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
    group['value'] = Math.max(Math.abs(P1), Math.abs(P2)); // 大きい方の値を保存　

    group.position.set(nodei.x, nodei.y, nodei.z);

    // 全体の向きを修正する
    const XY = new Vector2(localAxis.x.x, localAxis.x.y).normalize();
    let A = Math.asin(XY.y);

    if (XY.x < 0) {
      A = Math.PI - A;
    }
    group.rotateZ(A);

    const lenXY = Math.sqrt(Math.pow(localAxis.x.x, 2) + Math.pow(localAxis.x.y, 2));
    const XZ = new Vector2(lenXY, localAxis.x.z).normalize();
    group.rotateY(-Math.asin(XZ.y));
    // group.rotateX(Math.PI);
    group.name = ThreeLoadAxial.id + "-" + row.toString() + "-x";
    return group;
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
    // coneにのみスケールを反映させる
    const arrow = group.getObjectByName('arrow');
    if (arrow !== undefined) {
      arrow.scale.set(scale, 1, 1);
    }

  }

  // ハイライトを反映させる
  public setColor(group: any, status: string): void {

    const group0 = group.getObjectByName('group');

    function change(
      matLine: THREE.LineBasicMaterial, 
      matArrow: THREE.MeshBasicMaterial, 
      textVisible: boolean) {

      for(const child of  group0.children){
        if(child.name === 'child'){
          child.children.forEach(target => {
            if (target.name === 'line2') {
              target.material = matLine // 線のカラー
            } else if (target.name === 'arrow') {
              target.material = matArrow // 矢印のカラー
            }
          });
        } else if(child.name === 'text'){
          child.visible = textVisible;  // 文字を表示
        }
      }
    }

    if (status === "clear") {
      change(this.matLine, this.arrow_mat, false);
    } else {
      change(this.matLine_Pick, this.arrow_mat_Pick, true);
    }

    // 文字
    this.setText(group, status);

    // 寸法線
    this.setDim(group, status);
  }

  // 文字
  private setText(group: any, status: string): void {

    const group0 = group.getObjectByName('group');
    const child = group0.getObjectByName('child');
    // 一旦削除
    for(let i=0; i<2; i++){
      const key = 'P' + (i+1);
      const text = child.getObjectByName(key);
      if(text !== undefined){
        child.remove(text);
      }
    }

    if (status !== "select") {
      return;
    }

    const L1 = group.L1;
    const points = group.points;
    const pos1 = new Vector2(points[0] + L1, points[1]);
    const pos2 = new Vector2(points[3] + L1, points[4]);
    const pos = [pos1, pos2];
    const localAxis = group.localAxis;
    const vartical = ['bottom', 'top'];
    for(let i=0; i<2; i++){
      const key = 'P' + (i+1);
      const textString: string = group[key].toFixed(2) + " kN/m";
      const text = this.text.create(textString, pos[i], 0.1, 0.15);
      const height = Math.abs(text.geometry.boundingBox.max.y - text.geometry.boundingBox.min.y);
      const width = Math.abs(text.geometry.boundingBox.max.x - text.geometry.boundingBox.min.x);
      if (vartical[i] === 'bottom') {
        text.position.x += 0.5 * height;
      } else {
        text.position.x -= 0.5 * height;
      }
      text.position.y -= 0.5 * width;
      text.rotateX(Math.PI);
      if (localAxis.x.y === 1 || localAxis.x.y === -1) text.rotateZ(Math.PI/2);
      text.name = key;
      child.add(text);
    }
    
  }
  
  // 寸法線
  private setDim(group: any, status: string): void{
    
    const group0 = group.getObjectByName('group');
    const child = group0.getObjectByName('child');

    const point = group.points;
    const L1: number = group.L1;
    const L: number = group.L;
    const L2: number = group.L2
    const points = [new Vector3(point[0].x + L1, point[0].y, 0),
                    new Vector3(point[0].x + L1, child.position.y, 0),
                    new Vector3(point[1].x + L1, child.position.y, 0),
                    new Vector3(point[1].x + L1, point[1].y, 0)];

    // 一旦削除
    for(let i=0; i<2; i++){
      const text = group.getObjectByName('Dimension');
      if(text !== undefined){
        group.remove(text);
      }
    }

    if (status !== "select") {
      return;
    }

    const dim = new THREE.Group();

    let dim1: THREE.Group;
    let dim2: THREE.Group;
    let dim3: THREE.Group;

    const size: number = 0.1; // 文字サイズ

    //const y1a = Math.abs(points[1].y);
    //const y3a = Math.abs(points[2].y);
    //const y4a = Math.max(y1a, y3a) + (size * 10);
    //const a = (y1a > y3a) ? Math.sign(points[1].y) : Math.sign(points[2].y);
    const y4 = (size * 10);

    if(L1 > 0){
      const x0 = points[1].x - L1;
      const p = [
        new THREE.Vector2(x0, 0),
        new THREE.Vector2(x0, y4),
        new THREE.Vector2(points[1].x, y4),
        new THREE.Vector2(points[1].x, points[1].y),
      ];
      dim1 = this.dim.create(p, L1.toFixed(3))
      dim1.visible = true;
      dim1.name = "Dimension1";
      dim.add(dim1);
    }

    const p = [
      new THREE.Vector2(points[1].x, points[1].y),
      new THREE.Vector2(points[1].x, y4),
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

    // 登録
    dim.name = "Dimension";

    group.add(dim);
  
  }
  
}
