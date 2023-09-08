import { Component } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { XRControllerModelFactory, XRControllerModel } from 'three/addons/webxr/XRControllerModelFactory.js';


class ThreeScene extends Component{

    private mount: HTMLDivElement | null = null;
    private scene: THREE.Scene | null = null;
    private camera: THREE.PerspectiveCamera | null = null;
    private renderer: THREE.WebGLRenderer | null = null;
    private cube: THREE.Mesh | null = null;
    private light: THREE.Light | null = null;
    private controller1: XRControllerModel | null = null
    private controller2: XRControllerModel | null = null
    private controllerGrip1: THREE.XRGripSpace | null = null;
    private controllerGrip2: THREE.XRGripSpace | null = null;

    private xrRefSpace: XRReferenceSpace | null = null;
    private session: XRSession | null = null;
    private gl: WebGL2RenderingContext | WebGLRenderingContext | null = null;
    

    componentDidMount(){
      
      const width = (this.mount as HTMLDivElement).clientWidth;
      // const height = (this.mount as HTMLDivElement).clientHeight;
      // const width = 500;
      const height = 700;
      
      //ADD SCENE
      this.scene = new THREE.Scene();
      
      //ADD CAMERA
      this.camera = new THREE.PerspectiveCamera(
        75,
        width / height,
        0.1,
        1000
        );
      this.camera.position.set(0, 1.7, 0);
        
      //ADD CUBE
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: '#433F81' });
      this.cube = new THREE.Mesh(geometry, material);
      this.scene.add(this.cube);
      this.cube.position.set(0, 1.7, -2);

      //ADD LIGHT
      this.light = new THREE.PointLight("#fffff", 20);
      this.scene.add(this.light);
      
      //ADD RENDERER
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      if (this.renderer === null) return;
      
      this.renderer.setClearColor('#000000');
      this.renderer.setSize(width, height);
      this.mount?.replaceChildren(this.renderer.domElement);
      document.body.appendChild(VRButton.createButton(this.renderer));
      this.renderer.xr.enabled = true;
      
      //ADD CONTROLLER
      const controllerModelFactory = new XRControllerModelFactory();
      this.controllerGrip1 = this.renderer.xr.getControllerGrip( 0 );
      this.controllerGrip1.add( controllerModelFactory.createControllerModel( this.controllerGrip1 ) );
      this.scene.add( this.controllerGrip1 );

      this.controllerGrip2 = this.renderer.xr.getControllerGrip( 1 );
      this.controllerGrip2.add( controllerModelFactory.createControllerModel( this.controllerGrip2 ) );
      this.scene.add( this.controllerGrip2 );
      
      // RENDER
      this.xrRefSpace = this.renderer.xr.getReferenceSpace();
      this.renderer.setAnimationLoop(this.onXRFrame);
    }


    onXRFrame = () => {
      if (this.scene === null || this.camera === null || this.renderer === null || this.light === null) { return; } //  this.session === null || this.gl === null ||

      this.cube?.rotateX(0.01);
      this.cube?.rotateY(0.01);
      this.light.position.copy(this.camera.position)
      this.renderer.render(this.scene, this.camera);
    }
    
    render(){
      return (
        <div
        ref={mount => {
            this.mount = mount;
        }}
        />
      )
    }
}

export default ThreeScene;