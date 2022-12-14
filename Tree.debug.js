Tree.Debug = {};

//Singleton Class for creating the GridFloor.
Tree.Debug.GridFloor = class{
	static getRenderable(){
		if(Tree.Debug.GridFloor.renderable) return Tree.Debug.GridFloor.renderable;

		var material	= Tree.Debug.GridFloor.buildMaterialShader(),
			mesh		= Tree.Debug.GridFloor.buildMesh();

			Tree.Debug.GridFloor.renderable = new Tree.Renderable(mesh,"TreeGridFloor");
		return Tree.Debug.GridFloor.renderable;
	}

	static buildMaterialShader(){
		var vShader = '#version 300 es\n' +
			'layout(location=0) in vec4 a_position;' +
			'uniform UBOTransform{ mat4 matProjection; mat4 matCameraView; };' +
			'uniform mat4 uModalMatrix;' +
			'void main(void){ gl_Position = matProjection * matCameraView * uModalMatrix * vec4(a_position.xyz, 1.0); }';
		var fShader = '#version 300 es\n' +
			'precision mediump float;' +
			'out vec4 finalColor;' +
			'void main(void){ finalColor = vec4( 0.1, 0.4, 0.5 ,1.0); }';

			Tree.Shaders.New("TreeGridFloor",vShader,fShader)
			.prepareUniforms(Tree.UNI_MODEL_MAT_NAME,"mat4")
			.prepareUniformBlocks(Tree.Res.Ubo[Tree.UBO_TRANSFORM],0);

		var mat = Tree.Shaders.Material.create("TreeGridFloor","TreeGridFloor");
		mat.drawMode = Tree.gl.LINES;
		return 
	}

	static buildMesh(){
		//Dynamiclly create a grid
		var verts = [],
			size = 90,			// W/H of the outer box of the grid, from origin we can only go 1 unit in each direction, so from left to right is 2 units max
			div = 1200.0,			// How to divide up the grid
			step = size / div,	// Steps between each line, just a number we increment by for each line in the grid.
			half = size / 2;	// From origin the starting position is half the size.

		var p;	//Temp variable for position value.
		for(var i=0; i <= div; i++){
			//Vertical line
			p = -half + (i * step);	verts.push(p, 0, half, p, 0, -half);
			//Horizontal line
			p = half - (i * step);	verts.push(-half, 0, p, half, 0, p);
		}

		return Tree.Shaders.VAO.standardMesh("TreeGridFloor",3,verts,null,null,null,false);
	}
};


Tree.Debug.Lines = class{
	static getRenderable(){
		if(Tree.Debug.Lines.renderable) return Tree.Debug.Lines.renderable;

		//......................................
		//CREATE SHADER
		var vShader = '#version 300 es\n'+
			'layout(location=0) in vec4 a_position;' +
			'uniform UBOTransform{ mat4 matProjection; mat4 matCameraView; };' +
			'uniform vec3 uColorAry[20];'+
			'out lowp vec4 color;'+
			'void main(void){'+
				'color = vec4(uColorAry[ int(a_position.w) ],1.0);'+ 
				'gl_Position = matProjection * matCameraView * vec4(a_position.xyz, 1.0); '+
			'}';

		var fShader = '#version 300 es\n precision mediump float; in vec4 color; out vec4 finalColor; void main(void){ finalColor = color; }';

		Tree.Shaders.New("TreeDebugLine",vShader,fShader)
			.prepareUniforms("uColorAry","vec3")
			.prepareUniformBlocks(Tree.Res.Ubo[Tree.UBO_TRANSFORM],0);

		//......................................
		//CREATE MATERIAL
		var mat = Tree.Shaders.Material.create("TreeDebugLine","TreeDebugLine");
		mat.useModelMatrix = false;
		mat.drawMode = Tree.gl.LINES;

		//......................................
		//CREATE RENDERABLE
		var ren = new Tree.Debug.Lines();
		ren.material = mat;
		return Tree.Debug.Lines.renderable = ren;
	}

	constructor(){
		this._colorList		= [];
		this._colorArray	= [];
		this._verts			= [];
		this._isModified 	= true;
		this._bufSize		= Float32Array.BYTES_PER_ELEMENT * 8 * 100; //8Floats per line

		this.vao			= {};
		this.visible		= true;
		this.material		= null;

		//Create VAO with a buffer with space for 100 lines.
		Tree.Shaders.VAO.create(this.vao)
			.emptyFloatArrayBuffer(this.vao,"vert",this._bufSize,Tree.ATTR_POSITION_LOC,4,0,0,false,false)
			.finalize(this.vao,"TreeDebugLines");
		this.vao.count = 0;
	}

	draw(){
		if(this.vao.count > 0){
			Tree.gl.bindVertexArray(this.vao.id);
			Tree.gl.drawArrays(Tree.gl.LINES, 0, this.vao.count);
		}
	}

	update(){
		if(!this._isModified) return;
		
		//If there is no verts, set this to invisible to disable rendering.
		this._isModified = false;
		if(this._verts.length == 0){ this.visible = false; return this; }
		this.visible = true;
		
		//Calc how many vec4 elements we have
		this.vao.count = this._verts.length / 4;
		
		//Push verts to GPU.
		Tree.gl.bindBuffer(Tree.gl.ARRAY_BUFFER,this.vao.buffers["vert"].buf);
		Tree.gl.bufferSubData(Tree.gl.ARRAY_BUFFER, 0, new Float32Array(this._verts), 0, null);
		Tree.gl.bindBuffer(Tree.gl.ARRAY_BUFFER,null);

		//Update Uniform
		this.material.shader.activate();
		this.material.shader.setUniforms("uColorAry",this._colorArray);
		this.material.shader.deactivate();
		return this;
	}

};