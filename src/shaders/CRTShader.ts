/**
 * @file CRTShader.ts
 * @description CRT barrel distortion and effects shader for Phaser 3.
 */

import Phaser from 'phaser';

const fragShader = `
precision mediump float;

uniform sampler2D uMainSampler;
uniform vec2 uResolution;
uniform float uTime;
uniform float uCurvature;
uniform float uScanlineIntensity;
uniform float uVignetteIntensity;

varying vec2 outTexCoord;

// Barrel distortion function
vec2 barrelDistortion(vec2 coord, float amt) {
    vec2 cc = coord - 0.5;
    float dist = dot(cc, cc);
    return coord + cc * dist * amt;
}

// Scanline effect
float scanline(vec2 coord) {
    float scan = sin(coord.y * uResolution.y * 3.14159) * 0.5 + 0.5;
    return mix(1.0, scan, uScanlineIntensity);
}

// Vignette effect - rounded rectangle shape
float vignette(vec2 coord) {
    vec2 uv = coord * (1.0 - coord.yx);
    float vig = uv.x * uv.y * 15.0;
    return pow(vig, uVignetteIntensity);
}

void main() {
    // Apply barrel distortion
    vec2 distortedCoord = barrelDistortion(outTexCoord, uCurvature);
    
    // Check if we're outside the texture bounds after distortion
    if (distortedCoord.x < 0.0 || distortedCoord.x > 1.0 || 
        distortedCoord.y < 0.0 || distortedCoord.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }
    
    // Sample the texture
    vec4 color = texture2D(uMainSampler, distortedCoord);
    
    // Apply scanlines
    color.rgb *= scanline(distortedCoord);
    
    // Apply vignette
    color.rgb *= vignette(distortedCoord);
    
    // Slight RGB shift at edges for chromatic aberration
    float aberration = length(outTexCoord - 0.5) * 0.002;
    color.r = texture2D(uMainSampler, barrelDistortion(outTexCoord + vec2(aberration, 0.0), uCurvature)).r;
    color.b = texture2D(uMainSampler, barrelDistortion(outTexCoord - vec2(aberration, 0.0), uCurvature)).b;
    
    gl_FragColor = color;
}
`;

export class CRTPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    private _curvature: number = 0.1;
    private _scanlineIntensity: number = 0.1;
    private _vignetteIntensity: number = 0.2;

    constructor(game: Phaser.Game) {
        super({
            game,
            name: 'CRTPipeline',
            fragShader,
        });
    }

    onPreRender(): void {
        this.set1f('uTime', this.game.loop.time / 1000);
        this.set2f('uResolution', this.renderer.width, this.renderer.height);
        this.set1f('uCurvature', this._curvature);
        this.set1f('uScanlineIntensity', this._scanlineIntensity);
        this.set1f('uVignetteIntensity', this._vignetteIntensity);
    }

    get curvature(): number {
        return this._curvature;
    }

    set curvature(value: number) {
        this._curvature = value;
    }

    get scanlineIntensity(): number {
        return this._scanlineIntensity;
    }

    set scanlineIntensity(value: number) {
        this._scanlineIntensity = value;
    }

    get vignetteIntensity(): number {
        return this._vignetteIntensity;
    }

    set vignetteIntensity(value: number) {
        this._vignetteIntensity = value;
    }
}
