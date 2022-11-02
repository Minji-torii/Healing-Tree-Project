//data structure is a flat array
//geometry matrixs의 요소들을 다시 정의
//core에 들어오기 전 요소들을 정립(refactor)
//prototype
var Kai = (function(){
	var comLen = 4,		//Floats Values per Vertex
		pathVertCnt = 4,	//How many verts per path.
		pathFCnt = comLen * pathVertCnt;

	function GetVert(i,src,out){
		var p = i * comLen;
		out[0] = src[p];
		out[1] = src[p+1];
		out[2] = src[p+2];
	}

	//Extrude --------------------------------------
	function Extrude(dir,ind,out){
		var p,idx = (out.length)/comLen;

		for(var i=0; i < ind.length; i++){
			p = ind[i] * comLen;
			out.push(
				out[p]		+ dir[0],
				out[p+1]	+ dir[1],
				out[p+2]	+ dir[2],
				out[p+3]
			);		
		}
		return [idx,idx+1,idx+2,idx+3]
	}

	function ExtrudeBranch(iAry,out){
		var p = q = 0;
			x = y = z = 0;

		//.....................................
		//Figure out Direction
		var dir = [0,0,0];
		quadCenterPos(iAry,out,dir);
		dir[1] = 0; //Ditch Y for now
		norm(dir);

		//.....................................
		//Loop threw Quad Index Points
		var ind = out.length / comLen;
		for(q=0; q < comLen; q++){
			p = iAry[q] * comLen;
			out.push(
				out[p]		+ dir[0],
				out[p+1]	+ dir[1],
				out[p+2]	+ dir[2],
				out[p+3]
			);						
		}

		return [ind,ind+1,ind+2,ind+3];
	}

	//Scale ----------------------------------------
	function Scale(iAry,s,src){
		var p;
		for(var i=0; i < iAry.length; i++){
			p = iAry[i] * comLen;
			src[p]		*= s[0];
			src[p+1]	*= s[1];
			src[p+2]	*= s[2];
		}
	}

	function ScaleCenter(iAry,s,src){
		var c = [0,0,0];
		Kai.QuadCenterPos(iAry,src,c);

		for(var i=0; i < iAry.length; i++){
			p = iAry[i] * comLen;
			src[p]		= ((src[p+0] - c[0]) * s) + c[0];
			src[p+1]	= ((src[p+1] - c[1]) * s) + c[1];
			src[p+2]	= ((src[p+2] - c[2]) * s) + c[2];
		}
	}

	//Rotation -------------------------------------
	function Rot(iAry,rad,axis,src){
		var cos = Math.cos(rad),
			sin = Math.sin(rad),
			x,y,z,rx,ry,rz;

		var p;
		for(var i=0; i < iAry.length; i++){
			p = iAry[i] * comLen;
			x = src[p];
			y = src[p+1];
			z = src[p+2];

			switch(axis){
				case "y": ry = y; rx = z*sin + x*cos; rz = z*cos - x*sin; break;
				case "x": rx = x; ry = y*cos - z*sin; rz = y*sin + z*cos; break;
				case "z": rz = z; rx = x*cos - y*sin; ry = x*sin + y*cos; break;
			}

			src[p]		= rx;
			src[p+1]	= ry;
			src[p+2]	= rz;
		}
	}

	function qRot(rad,iAry,src){
		var p0 = iAry[0] * 4,
			p1 = iAry[3] * 4;
		var v1 = [ src[p1] - src[p0], src[p1+1] - src[p0+1], src[p1+2] - src[p0+2] ];
		Kai.Norm(v1);
		var q = new Tree.Maths.Quaternion();
		q.setAxisAngle(v1, rad);

		var ary = [0,0,0];

		for(var i=0; i < iAry.length; i++){
			p = iAry[i] * comLen;
			ary[0] = src[p];
			ary[1] = src[p+1];
			ary[2] = src[p+2];
			
			Tree.Maths.Quaternion.rotateVec3(q,ary);

			src[p]		= ary[0];
			src[p+1]	= ary[1];
			src[p+2]	= ary[2];
		}
	}

	function qRotCenter(rad,iAry,src){
		var c = [0,0,0];
		Kai.QuadCenterPos(iAry,src,c);

		var p0 = iAry[0] * comLen,
			p1 = iAry[3] * comLen;
		var v1 = [ src[p1] - src[p0], src[p1+1] - src[p0+1], src[p1+2] - src[p0+2] ];
		Kai.Norm(v1);
		
		var q = new Tree.Maths.Quaternion();
		q.setAxisAngle(v1, rad);

		var ary = [0,0,0];

		for(var i=0; i < iAry.length; i++){
			p = iAry[i] * 4;
			ary[0] = src[p] - c[0];
			ary[1] = src[p+1] - c[1];
			ary[2] = src[p+2] - c[2];
			
			Tree.Maths.Quaternion.rotateVec3(q,ary);

			src[p]		= ary[0] + c[0];
			src[p+1]	= ary[1] + c[1];
			src[p+2]	= ary[2] + c[2];
		}
	}


	//Triangle Faces ------------------------------
	function TriQuad(iAry,out){ out.push(iAry[0],iAry[1],iAry[2],iAry[2],iAry[3],iAry[0]); }

	function TriWall(iAryA,iAryB,out,mkHole,brOut){
		var a,b,c,d,p;

		//quad 찾기
		for(var i=0; i < pathVertCnt; i++){
			p = (i+1)%pathVertCnt;
			a = iAryB[i],
			b = iAryA[i],
			c = iAryA[p],
			d = iAryB[p];
			//console.log(a,b,c,c,d,a,"--",i,p);

			if(mkHole == -1 || p%2 != mkHole) out.push(a,b,c,c,d,a); //a=a; // 
			else brOut.push([a,b,c,d]);
		}
	}


	//Math ----------------------------------------
	function Rnd(min,max){ return min + (Math.random() * (max-min)); }

	//방향을 정하는걸 돕는 함수
	//우리의 Quad의 정면이 어딜까?
	function QuadCrossProd(iAry,src,out,s){
		var p0 = iAry[0] * comLen,
			p1 = iAry[1] * comLen,
			p3 = iAry[3] * comLen;

		var v1 = [ src[p1] - src[p0], src[p1+1] - src[p0+1], src[p1+2] - src[p0+2] ],
			v2 = [ src[p3] - src[p0], src[p3+1] - src[p0+1], src[p3+2] - src[p0+2] ],
			cp = [0, 0, 0];
		
			Tree.Maths.Vec3.cross(v1,v2,out);
		Norm(out,s);
	}

	function QuadCenterPos(ind,src,out){
		var x = y = z = 0;

		for(var q=0; q < comLen; q++){
			p = ind[q] * comLen;
			x += src[p];
			y += src[p+1];
			z += src[p+2];
		}

		out[0] = x/4;
		out[1] = y/4;
		out[2] = z/4;
	}

	function Norm(out,s){
		var mag = Math.sqrt(out[0] * out[0] + out[1] * out[1] + out[2] * out[2]);
		if(s === undefined) s = 1;
		out[0] = out[0] / mag * s;
		out[1] = out[1] / mag * s;
		out[2] = out[2] / mag * s;
	}

	//방향 - 실제로 위로 향하는 방향 계산
	function qPlacement(vUp, out){
		var zAxis	= new Fungi.Maths.Vec3(),	//Forward
			//up		= new Vec3(vUp),
			tmp		= new Fungi.Maths.Vec3(0,1,0);
			yAxis	= new Fungi.Maths.Vec3(vUp),
			xAxis	= new Fungi.Maths.Vec3();		//Right
			//yAxis	= new Vec3();
	
	
		yAxis.normalize(); //Normalize Top
		Fungi.Maths.Vec3.cross(yAxis,tmp,zAxis); //Forward Direction
		zAxis.normalize();
		Fungi.Maths.Vec3.cross(yAxis,zAxis,xAxis); //Left Direction
	
		//fromAxis - Mat3 to Quaternion
		var m00 = xAxis.x, m01 = xAxis.y, m02 = xAxis.z,
			m10 = yAxis.x, m11 = yAxis.y, m12 = yAxis.z,
			m20 = zAxis.x, m21 = zAxis.y, m22 = zAxis.z,
			t = m00 + m11 + m22,
			x, y, z, w, s;
	
		if(t > 0.0){
			s = Math.sqrt(t + 1.0);
			w = s * 0.5 ; // |w| >= 0.5
			s = 0.5 / s;
			x = (m12 - m21) * s;
			y = (m20 - m02) * s;
			z = (m01 - m10) * s;
		}else if((m00 >= m11) && (m00 >= m22)){
			s = Math.sqrt(1.0 + m00 - m11 - m22);
			x = 0.5 * s;// |x| >= 0.5
			s = 0.5 / s;
			y = (m01 + m10) * s;
			z = (m02 + m20) * s;
			w = (m12 - m21) * s;
		}else if(m11 > m22){
			s = Math.sqrt(1.0 + m11 - m00 - m22);
			y = 0.5 * s; // |y| >= 0.5
			s = 0.5 / s;
			x = (m10 + m01) * s;
			z = (m21 + m12) * s;
			w = (m20 - m02) * s;
		}else{
			s = Math.sqrt(1.0 + m22 - m00 - m11);
			z = 0.5 * s; // |z| >= 0.5
			s = 0.5 / s;
			x = (m20 + m02) * s;
			y = (m21 + m12) * s;
			w = (m01 - m10) * s;
		}
		out[0] = x;
		out[1] = y;
		out[2] = z;
		out[3] = w;
	}

	return {TriWall:TriWall, Extrude:Extrude, TriQuad:TriQuad, QuadCenterPos:QuadCenterPos, 
		Norm:Norm, GetVert:GetVert, QuadCrossProd:QuadCrossProd, Scale:Scale, ScaleCenter:ScaleCenter, 
		Rot:Rot, qRot:qRot, qRotCenter:qRotCenter, Rnd:Rnd , qPlacement:qPlacement};
})();