/** Compile and render actual atlas shaders; no FPS inference from software GL. */
import {chromium} from 'playwright';
import {readFile} from 'node:fs/promises';
import {S3_MULTIVIEW_VERTEX} from '../visual/shaders/s3-multiview.mjs';
const source=await readFile(new URL('../index.html',import.meta.url),'utf8');
const bodies=['BHR_FRAG','BHG_FRAG'].map(name=>({name,code:source.match(new RegExp('const '+name+'=`([\\s\\S]*?)`;'))[1]}));
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
  const page=await browser.newPage();
  const result=await page.evaluate(({bodies,multiviewVertex})=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
    const gl=canvas.getContext('webgl2',{antialias:false,preserveDrawingBuffer:true});
    if(!gl)return {ran:false,reason:'no WebGL2 context'};
    const tests=[];
    const shader=(type,code)=>{const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
    const vertex=shader(gl.VERTEX_SHADER,'attribute vec2 position; varying vec3 vPos; void main(){vPos=vec3(0.0);gl_Position=vec4(position,0.0,1.0);}');
    for(const {name,code} of bodies){
      const fragment=shader(gl.FRAGMENT_SHADER,code),program=gl.createProgram();
      gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
      const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
      gl.uniform3f(gl.getUniformLocation(program,'uCam'),0,0,1.01);
      gl.uniform1i(gl.getUniformLocation(program,'uSteps'),1);
      for(const [key,value] of [['uDisk',1],['uEncode',0],['uGain',1],['uRout',14]])gl.uniform1f(gl.getUniformLocation(program,key),value);
      gl.drawArrays(gl.TRIANGLES,0,3);const pixel=new Uint8Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
      tests.push({name:`${name} captures horizon crossed on final allowed step`,pass:pixel[0]===0&&pixel[1]===0&&pixel[2]===0&&pixel[3]===255,pixel:[...pixel]});
      gl.uniform3f(gl.getUniformLocation(program,'uCam'),0,0,0);gl.drawArrays(gl.TRIANGLES,0,3);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
      tests.push({name:`${name} finite result inside horizon`,pass:pixel[0]===0&&pixel[1]===0&&pixel[2]===0&&pixel[3]===255,pixel:[...pixel]});
      gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(fragment);
    }
    const extension=gl.getExtension('OVR_multiview2');
    if(extension){
      const vs=shader(gl.VERTEX_SHADER,multiviewVertex);
      const fs=shader(gl.FRAGMENT_SHADER,'#version 300 es\nprecision highp float; in vec3 vNormal; in float vChartValid; out vec4 color; void main(){if(vChartValid<0.999)discard;color=vec4(0.5*(vNormal+1.0),1.0);}');
      const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D_ARRAY,texture);gl.texStorage3D(gl.TEXTURE_2D_ARRAY,1,gl.RGBA8,1,1,2);
      const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);extension.framebufferTextureMultiviewOVR(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,texture,0,0,2);
      if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('multiview framebuffer incomplete');
      const data=new Float32Array(36);
      [[-2,-2],[2,-2],[0,2]].forEach(([x,y],i)=>{
        const d=1+x*x+y*y;
        data.set([2*x/d,2*y/d,0,(d-2)/d,2/d-4*x*x/(d*d),-4*x*y/(d*d),0,4*x/(d*d),-4*x*y/(d*d),2/d-4*y*y/(d*d),0,4*y/(d*d)],12*i);
      });
      const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
      for(let i=0;i<3;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,4,gl.FLOAT,false,48,i*16);}
      const identity=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],matrices=new Float32Array([...identity,...identity]);
      gl.uniformMatrix4fv(gl.getUniformLocation(program,'uProjMatrices[0]'),false,matrices);gl.uniformMatrix4fv(gl.getUniformLocation(program,'uViewMatrices[0]'),false,matrices);
      gl.uniform4f(gl.getUniformLocation(program,'uQuatL'),0,0,0,1);gl.uniform4f(gl.getUniformLocation(program,'uQuatR'),0,0,0,1);gl.uniform1f(gl.getUniformLocation(program,'uRadiusS3'),1);
      gl.drawArrays(gl.TRIANGLES,0,3);
      const read=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,read);
      for(let eye=0;eye<2;eye++){
        gl.framebufferTextureLayer(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,texture,0,eye);
        const pixel=new Uint8Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
        tests.push({name:`S3 multiview eye ${eye} uses projected tangent normal`,pass:Math.abs(pixel[0]-128)<=1&&Math.abs(pixel[1]-128)<=1&&pixel[2]===255&&pixel[3]===255,pixel:[...pixel]});
      }
      gl.deleteBuffer(buffer);gl.deleteFramebuffer(fb);gl.deleteFramebuffer(read);gl.deleteTexture(texture);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
    }
    const error=gl.getError();gl.deleteShader(vertex);
    return {ran:true,renderer:gl.getParameter(gl.RENDERER),multiview:!!extension,tests,glError:error};
  },{bodies,multiviewVertex:S3_MULTIVIEW_VERTEX});
  console.log(JSON.stringify(result,null,2));
  if(!result.ran||result.glError!==0||result.tests.some(t=>!t.pass))process.exitCode=1;
}finally{await browser.close();}
