import { Injectable } from '@angular/core';
import * as THREE from "three";

import { ThreeLoadText } from "./three-load-text";

@Injectable({
  providedIn: 'root'
})
export class ThreeLoadDimension {

  private text: ThreeLoadText;
  private line_mat: THREE.LineBasicMaterial;
  
  constructor(text: ThreeLoadText) {
    this.text = text;
    this.line_mat = new THREE.LineBasicMaterial({ color: 0x000000 });

  }

   // 寸法線を編集する
   public create( points: THREE.Vector2[], textStr: string ): THREE.Group {

    const positions = [
      new THREE.Vector3(points[0].x, points[0].y, 0),
      new THREE.Vector3(points[1].x, points[1].y, 0),
      new THREE.Vector3(points[2].x, points[2].y, 0),
      new THREE.Vector3(points[3].x, points[3].y, 0),
    ];
    const line_color = 0x000000;


    const group = new THREE.Group();

    group.add(this.getLine(positions));


    // 矢印を描く
    /*const length = 0.5; // 長さ
    const origin = new THREE.Vector3(length, 1, 0);

    const dir1 = new THREE.Vector3(-1, 0, 0); // 矢印の方向（単位ベクトル）
    const arrow1 = new THREE.ArrowHelper(dir1, origin, length, line_color);
    arrow1.position.set(points[1].x + 0.5, points[1].y, 0);
    arrow1.name = "arrow1";
    
    group.add(arrow1);


    const dir2 = new THREE.Vector3(1, 0, 0); // 矢印の方向（単位ベクトル）
    const arrow2 = new THREE.ArrowHelper(dir2, origin, length, line_color);
    arrow2.position.set(points[2].x - 0.5, points[2].y, 0);
    arrow2.name = "arrow2";

    group.add(arrow2);*/

    // 寸法線のはみ出している部分を描く
    for(let i = 0; i < 2; i++){
      const positions2 = [
        new THREE.Vector3(0, -0.03, 0),
        new THREE.Vector3(0, 0.03, 0),
        new THREE.Vector3(0, 0, 0),
      ];
      if (i === 0) {
        positions2.push( new THREE.Vector3(-0.02, 0, 0) )
      } else {
        positions2.push( new THREE.Vector3( 0.02, 0, 0) )
      }
      const plus = this.getLine(positions2)
      plus.position.set(points[i + 1].x, points[i + 1].y, 0)
      group.add(plus);
    }

    // 文字を描く
    const x = points[1].x + (points[2].x - points[1].x) / 2;
    const y = points[1].y + (points[2].y - points[1].y) / 2;
    const horizontal: string = 'center';
    let vartical: string = 'top';
    if(points[1].y >= 0 ){
      if (points[1].y < points[0].y) vartical = 'bottom';
    } else {
      if (points[1].y > points[0].y) vartical = 'bottom';
    }

    const text = this.text.create(textStr, new THREE.Vector2(x, y), 0.1);
    const height = Math.abs(text.geometry.boundingBox.max.y - text.geometry.boundingBox.min.y);
    const width = Math.abs(text.geometry.boundingBox.max.x - text.geometry.boundingBox.min.x);
    if (vartical === 'bottom') {
      text.position.y -= 0.5 * height;
    } else if (vartical === 'top') {
      text.position.y += 0.5 * height;
    }
    if (horizontal === 'left') {
      text.position.x += 0.5 * width;
    } else if (horizontal === 'right') {
      text.position.x -= 0.5 * width;
    }
    // text.rotateX(Math.PI);
    // text.rotateZ(Math.PI);
    // text.rotateY(Math.PI);
    text.name = "text";

    group.add(text);

    return group;

  }

  private getLine(positions: THREE.Vector3[]): THREE.Line{
    //const line_color = 0x000000;

    // 面の周りの枠線を描く
    //const line_mat = new THREE.LineBasicMaterial({ color: line_color });
    const line_geo = new THREE.BufferGeometry().setFromPoints(positions);
    const line = new THREE.Line(line_geo, this.line_mat);
    line.name = "line";

    return line;

  }


}
