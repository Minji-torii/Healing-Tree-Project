TreeApp = {
	renderLoop		:null,
	mainCamera		:null,
	ctrlCamera		:null,
	debugLines		:null,
	gridFloor		:null,
	uboTransform	:null,
	lblFPS			:null,
	scene			:[],

	startup:function(){
		Tree.Init("TreeCanvas").fClearColor(" #00314e").fFitScreen(1,0.9).fClear();
		//#005282 #004975 #004168 #00395b #00314e #002941 #002034
		this.uboTransform	= Tree.Shaders.UBO.createTransformUBO();
		this.mainCamera		= new Tree.CameraOrbit().setPosition(0,5,19).setEulerDegrees(-15,0,0);
		this.ctrlCamera		= new Tree.KBMCtrl().addHandler("camera",new Tree.KBMCtrl_Viewport(this.mainCamera),true);

		this.renderLoop		= new Tree.RenderLoop(onRender);
		this.debugLines		= Tree.Debug.Lines.getRenderable().update();
		this.gridFloor 		= Tree.Debug.GridFloor.getRenderable()

		this.scene.push(this.debugLines,this.gridFloor);

		this.lblFPS = document.getElementById("lblFPS");
		setInterval(function(){ TreeApp.lblFPS.innerHTML = TreeApp.renderLoop.fps; },200);
	},

	update:function(){
		this.mainCamera.update();
		Tree.gl.fClear();
	}
};