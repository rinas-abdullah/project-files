import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../lib/motion'

const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'

// "Blood silk": domain-warped fbm noise mapped from near-black to crimson with a soft sheen.
const FRAG = `precision highp float;
uniform vec2 r; uniform float t; uniform vec2 m;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*r)/r.y; uv+=(m-.5)*.08; float tt=t*.06;
  vec2 q=vec2(fbm(uv*1.6+tt),fbm(uv*1.6-tt+3.1));
  vec2 w=vec2(fbm(uv*1.4+2.*q+vec2(1.7,9.2)+tt*1.3),fbm(uv*1.4+2.*q+vec2(8.3,2.8)-tt));
  float f=fbm(uv*1.2+2.4*w);
  float silk=smoothstep(.35,.95,f);
  float sheen=pow(smoothstep(.55,.9,f*(.6+.6*w.x)),3.);
  vec3 col=mix(vec3(.035,.035,.045),vec3(.45,.03,.11),silk);
  col=mix(col,vec3(.9,.13,.3),sheen*.8);
  col+=vec3(1.,.6,.65)*pow(sheen,4.)*.25;
  float v=smoothstep(1.25,.2,length(uv*vec2(.8,1.1)));
  col*=.35+.65*v;
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
