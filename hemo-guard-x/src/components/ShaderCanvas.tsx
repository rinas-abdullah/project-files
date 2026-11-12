import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../lib/motion'

const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'

// "Blood silk": one broad ribbon of folded fabric sweeping across the hero. Low-frequency
// domain warp drives sine folds; thin specular highlights ride the crests. Crimson only.
const FRAG = `precision highp float;
uniform vec2 r; uniform float t; uniform vec2 m;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.01+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*r)/r.y; uv+=(m-.5)*.06; float tt=t*.05;
  float a=-.55; vec2 p=mat2(cos(a),-sin(a),sin(a),cos(a))*uv;
  float w1=fbm(p*.7+vec2(tt,-tt*.6)), w2=fbm(p*.9-vec2(tt*.8,0.)+4.3);
  // ribbon centre line meanders; mask fades the fabric out away from it
  float y=p.y-.18*sin(p.x*1.4+tt*3.)-.35*(w1-.5);
  float band=exp(-pow(y*2.4,2.))*smoothstep(-1.1,.2,p.x);
  float s=p.x*1.1+2.2*w1+1.1*w2+y*2.5;
  float fold=.5+.5*sin(s*3.2+tt*4.);
  float shade=smoothstep(0.,1.,fold);
  float crest=pow(fold,18.), glint=pow(fold,70.);
  vec3 bg=vec3(.035,.035,.045);
  vec3 col=bg;
  col=mix(col,vec3(.075,.006,.02),band*.9);
  col=mix(col,vec3(.34,.02,.07),band*shade*.75);
  col+=vec3(.75,.1,.22)*crest*band*.45;
  col+=vec3(1.,.65,.72)*glint*band*.2;
  col+=vec3(.14,.01,.035)*exp(-pow(y*.9,2.))*.15;
  float v=smoothstep(1.4,.25,length(uv*vec2(.75,1.)));
  col=mix(bg,col,.3+.7*v);
  gl_FragColor=vec4(col,1.);
}`

export function ShaderCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduce = usePrefersReducedMotion()

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const gl = c.getContext('webgl', { antialias: false })
    if (!gl) { c.style.display = 'none'; return }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src); gl.compileShader(s); return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { c.style.display = 'none'; return }
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const uR = gl.getUniformLocation(prog, 'r'), uT = gl.getUniformLocation(prog, 't'), uM = gl.getUniformLocation(prog, 'm')

    let mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5, visible = true, raf = 0
    const onMove = (e: PointerEvent) => { tx = e.clientX / innerWidth; ty = 1 - e.clientY / innerHeight }
    const size = () => {
      const d = Math.min(window.devicePixelRatio || 1, 1.5) * 0.6 // render at reduced resolution; the noise is soft
      c.width = c.clientWidth * d; c.height = c.clientHeight * d
      gl.viewport(0, 0, c.width, c.height)
    }
    const io = new IntersectionObserver((e) => { visible = e[0].isIntersecting })
    io.observe(c)
    size()
    window.addEventListener('resize', size)
    window.addEventListener('pointermove', onMove)

    const start = performance.now()
    const frame = (now: number) => {
      if (visible) {
        mx += (tx - mx) * 0.04; my += (ty - my) * 0.04
        gl.uniform2f(uR, c.width, c.height)
        gl.uniform1f(uT, reduce ? 20 : (now - start) / 1000 + 20)
        gl.uniform2f(uM, mx, my)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      }
      if (!reduce) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf); io.disconnect()
      window.removeEventListener('resize', size); window.removeEventListener('pointermove', onMove)
    }
  }, [reduce])

  return <canvas id="shader" ref={ref} aria-hidden="true" />
}
