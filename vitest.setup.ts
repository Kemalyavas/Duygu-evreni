import '@testing-library/jest-dom'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = () => {}
  disconnect = () => {}
  unobserve = () => {}
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
})

// Mock ResizeObserver
class MockResizeObserver {
  observe = () => {}
  disconnect = () => {}
  unobserve = () => {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
})

// Mock WebGL context for Three.js
HTMLCanvasElement.prototype.getContext = ((originalGetContext) => {
  return function (this: HTMLCanvasElement, contextId: any, options?: any): any {
    if (contextId === 'webgl' || contextId === 'webgl2' || contextId === 'experimental-webgl') {
      return {
        canvas: this,
        getExtension: () => null,
        getParameter: () => null,
        getShaderPrecisionFormat: () => ({ precision: 1, rangeMin: 1, rangeMax: 1 }),
        createShader: () => ({}),
        shaderSource: () => {},
        compileShader: () => {},
        createProgram: () => ({}),
        attachShader: () => {},
        linkProgram: () => {},
        getProgramParameter: () => true,
        getShaderParameter: () => true,
        useProgram: () => {},
        createBuffer: () => ({}),
        bindBuffer: () => {},
        bufferData: () => {},
        createTexture: () => ({}),
        bindTexture: () => {},
        texImage2D: () => {},
        texParameteri: () => {},
        enable: () => {},
        disable: () => {},
        blendFunc: () => {},
        clearColor: () => {},
        clear: () => {},
        viewport: () => {},
        drawArrays: () => {},
        drawElements: () => {},
        getUniformLocation: () => ({}),
        uniform1i: () => {},
        uniform1f: () => {},
        uniform2f: () => {},
        uniform3f: () => {},
        uniform4f: () => {},
        uniformMatrix4fv: () => {},
        getAttribLocation: () => 0,
        enableVertexAttribArray: () => {},
        vertexAttribPointer: () => {},
        createFramebuffer: () => ({}),
        bindFramebuffer: () => {},
        framebufferTexture2D: () => {},
        checkFramebufferStatus: () => 36053,
        deleteTexture: () => {},
        deleteFramebuffer: () => {},
        deleteBuffer: () => {},
        deleteProgram: () => {},
        deleteShader: () => {},
        pixelStorei: () => {},
        activeTexture: () => {},
        generateMipmap: () => {},
        isContextLost: () => false,
      } as unknown as WebGLRenderingContext
    }
    return (originalGetContext as any).call(this, contextId, options)
  }
})(HTMLCanvasElement.prototype.getContext) as unknown as typeof HTMLCanvasElement.prototype.getContext
