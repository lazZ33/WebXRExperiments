import { Component } from 'react';
import * as THREE from 'three';

class RawThreeScene extends Component{

    private mount: HTMLDivElement | null = null;
    private scene: THREE.Scene | null = null;
    private camera: THREE.PerspectiveCamera | null = null;
    private renderer: THREE.WebGLRenderer | null = null;

    private cube: THREE.Mesh | null = null;
    private controller: THREE.Mesh | null = null;

    private xrRefSpace: XRReferenceSpace | null = null;
    private session: XRSession | null = null;
    private gl: WebGL2RenderingContext | WebGLRenderingContext | null = null;
    private controllerInput: XRInputSource | null = null;

    componentDidMount(){
        const width = (this.mount as HTMLDivElement).clientWidth;
        // const height = (this.mount as HTMLDivElement).clientHeight;
        // const width = 500;
        const height = 1000;

        //ADD SCENE
        this.scene = new THREE.Scene();

        //ADD CAMERA
        this.camera = new THREE.PerspectiveCamera(
          75,
          width / height,
          0.1,
          1000
        );
        this.camera.position.z = 4;

        //ADD CONTROLLER CYLINDER
        const controllerGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.3);
        const controllerMaterial = new THREE.MeshNormalMaterial({ vertexColors: true });
        this.controller = new THREE.Mesh(controllerGeometry, controllerMaterial);
        this.scene.add(this.controller);

        //ADD CUBE
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: '#433F81' });
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);
        this.cube.position.set(0, 0, -2);

        //ADD RENDERER
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setClearColor('#000000');
        this.renderer.setSize(width, height);
        this.mount?.appendChild(this.renderer.domElement);

        navigator.xr?.requestSession('immersive-vr').then(this.OnSessionStarted);
    }

    OnSessionStarted = (session: XRSession) => {
        const gl = this.renderer?.getContext();
        if (!gl) { return; }

        this.gl = gl;

        this.session = session;

        // assume no disconnection
        this.controllerInput = this.session?.inputSources[0];

        // Use the new WebGL context to create a XRWebGLLayer and set it as the
        // sessions baseLayer. This allows any content rendered to the layer to
        // be displayed on the XRDevice.
        session.updateRenderState({ baseLayer: new XRWebGLLayer(session, this.gl) });

        // Get a frame of reference, which is required for querying poses. In
        // this case an 'local' frame of reference means that all poses will
        // be relative to the location where the XRDevice was first detected.
        session.requestReferenceSpace('local').then((refSpace) => {
          this.xrRefSpace = refSpace;

          session.requestAnimationFrame(this.onXRFrame);
        });
    }

    onXRFrame = (time: DOMHighResTimeStamp, frame: XRFrame) => {
      if (this.scene === null || this.camera === null || this.session === null || this.gl === null || this.renderer === null) { return; }

      this.session.requestAnimationFrame(this.onXRFrame);

      this.cube?.rotateX(0.01);
      this.cube?.rotateY(0.01);

      let controllerPose;
      if (this.controllerInput != null && this.controllerInput.gripSpace && this.xrRefSpace)
        controllerPose = frame.getPose(this.controllerInput.gripSpace, this.xrRefSpace);
      if (controllerPose){
        const position = controllerPose.transform.position;
        const orientation = controllerPose.transform.orientation;

        let w = position.w;
        let x = position.x;
        let y = position.y;
        let z = position.z;
        this.controller?.position.set(x, y, z);

        w = orientation.w;
        x = orientation.x;
        y = orientation.y;
        z = orientation.z;
        this.controller?.setRotationFromQuaternion(new THREE.Quaternion(x, y, z, w));
      }

      // Get the XRDevice pose relative to the Frame of Reference we created
      // earlier.
      let pose = frame.getViewerPose(this.xrRefSpace as XRReferenceSpace);

      if (pose) {
        let glLayer = this.session.renderState.baseLayer;
        if (!glLayer) { return; }

        const orientation = pose.transform.orientation;
        const position = pose.transform.position;

        let w = orientation.w;
        let x = orientation.x;
        let y = orientation.y;
        let z = orientation.z;
        this.camera.quaternion.set(x, y, z, w);

        x = position.x;
        y = position.y;
        z = position.z;
        this.camera.position.set(x, y, z);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, glLayer.framebuffer);

        // this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.renderer.setScissorTest( true );

        for (let view of pose.views) {
          let viewport = glLayer.getViewport(view);
          if (!viewport) { continue; }
          this.gl.viewport(viewport.x, viewport.y,
                      viewport.width, viewport.height);
          
          this.renderer.setViewport(viewport.x, viewport.y, viewport.width, viewport.height);
          this.renderer.setScissor(viewport.x, viewport.y, viewport.width, viewport.height);

					this.camera.updateProjectionMatrix();

          this.renderer.render(this.scene, this.camera);
        }
      } else {
        console.log("no pose")
      }
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

export default RawThreeScene;