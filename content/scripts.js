// *************************************
// VARIÁVEIS GERAIS
// *************************************
var totalMines = 0;

var isGame = false;
var minesLeft = 0;
var boardWidth = 0;
var boardHeight = 0;

var username = "";
var password = "";

var sound_on = true;

var prev_user = "";

var honor = [new Array(), new Array(), new Array(), new Array(), new Array(), new Array()];


//**************************************
// FUNÇÕES GERAIS
// *************************************

// gera html para as tabelas de jogo
function makeTable(w, h){
	var tbl = '<div class="container text-center"><table>';
	for (var i = 0; i < h; i++) {
		tbl += '<tr>';
		for (var j = 0; j < w; j++) {
			if (isMultiplayer)
				// botões de multiplayer
				tbl += '<td><div class="mp-btn" data-column="'+j+'" data-row="'+i+'"></div></td>';
			else
				// botões de singleplayer
				tbl += '<td><div class="board-btn" data-column="'+j+'" data-row="'+i+'"></div></td>';
		}
		tbl += "</tr>";
	}
	tbl += "</div>";

	return tbl;
}
function makeHonorTable(g, t){
		t = t + (g * 3);
		var tbl = '<table class="table table-striped"><thead><tr><th>Username</th><th>Score</th></tr></thead><tbody>';
		if (honor[t].length > 0) {
			if (honor[t].length < 10) { //caso não hajam 15 elementos na lista
				tbl += '<tr><th><i class="fa fa-hand-peace-o"></i>&nbsp;'+honor[t][0]['name']+'</th><th>'+honor[t][0]['score']+'</th></tr>';
				for(var i = 1; i < honor[t].length; i++){
					tbl += '<tr><th>'+honor[t][i]['name']+'</th><th>'+honor[t][i]['score']+'</th></tr>';
				}
			}
			else {
				tbl += '<tr><th><i class="fa fa-hand-peace-o"></i>&nbsp;'+honor[t][0]['name']+'</th><th>'+honor[t][0]['score']+'</th></tr>';
				for(var i = 1; i < 10; i++){
					tbl += '<tr><th>'+honor[t][i]['name']+'</th><th>'+honor[t][i]['score']+'</th></tr>';
				}
			}
		}
		tbl+='</tbody></table>';
		return tbl;
}

// *************************************
// VARIÁVEIS SINGLEPLAYER
// *************************************

var board = [[]];
var popped = [[]];
var timeSpent = 0;
var gameDifficulty = 0;
var timer;
var firstClick = true;

var honor = [new Array(), new Array(), new Array()];
// carregar as entradas da localStorage, caso existam
if (localStorage.getItem("beginner") !== undefined)
	localStorageGet(1);
if (localStorage.getItem("intermediate") !== undefined)
	localStorageGet(2);
if (localStorage.getItem("expert") !== undefined)
	localStorageGet(3);

ranking("beginner");
ranking("intermediate");
ranking("expert");
console.log(honor);


// *************************************
// FUNÇÕES SINGLEPLAYER
// *************************************

function localStorageInsert(level){
  if(level == 1){
    localStorage.setItem('beginner', JSON.stringify(honor[level-1]));
  }
  else if(level == 2){
    localStorage.setItem('intermediate', JSON.stringify(honor[level-1]));
  }
  else{
    localStorage.setItem('expert', JSON.stringify(honor[level-1]));
  }
}

function localStorageGet(level){
	var tmp = [];
	var len;
	if(level === 1)
     tmp = JSON.parse(localStorage.getItem('beginner'));
  else if(level === 2)
     tmp = JSON.parse(localStorage.getItem('intermediate'));
  else
     tmp = JSON.parse(localStorage.getItem('expert'));
	if(tmp === null)
		len = 0;
	else {
		len = tmp.length;
	}
	for(var i = 0; i < len; i++){
    honor[level-1].push(tmp[i]);
  }
}

// inserir vitória no quadro de honra e colocar o novo quadro na localStorage
function insertHonor(elem, difficulty){

	var t = difficulty-1;

	for(var i=honor[t].length; i>0 && honor[t][i-1].score>elem.score; i--)
		honor[t][i]=honor[t][i-1];
	honor[t][i]=elem;
	//SET LOCAL STORAGE
	localStorageInsert(difficulty);
}

function startGame(difficulty){
	isGame = true;
	timeSpent = 0;
	firstClick = true;
	gameDifficulty = difficulty;
	if (difficulty == 1) {
		totalMines = minesLeft = 10;
		boardWidth = 9;
		boardHeight = 9;
	}
	else if (difficulty == 2) {
		totalMines = minesLeft = 40;
		boardWidth = 16;
		boardHeight = 16;
	}
	else if (difficulty == 3) {
		totalMines = minesLeft = 99;
		boardWidth = 30;
		boardHeight = 16;
	}
	// cria as duas matrizes
	board = new Array(boardHeight);
	popped = new Array(boardHeight);
	for (var i = 0; i < boardHeight; i++) {
		board[i] = new Array(boardWidth);
		popped[i] = new Array(boardWidth);
	}
	//atualiza o progresso
	printProgress();
}

// imprime o progresso
function printProgress(){
	var tmp = totalMines-minesLeft;
	var progress_bar = '<i class="fa fa-bomb"></i> <progress value="'+ tmp +'" max="'+totalMines+'" style="color:grey"> </progress>';
	var progress = '<i class="fa fa-clock-o fa-lg"></i> ' + timeSpent + " segundos | "+ progress_bar;
	$("#counters").html(progress);
}

// função periódica para atualizar o contador de tempo
function updateTimer(){
	timeSpent++;
	//atualiza o progresso
	printProgress();
}

// reduzir o contador de minas
function decreaseMines(){
	minesLeft--;
	//atualiza o progresso
	printProgress();
}

// método para aumentar o contador de minas
function increaseMines(){
	minesLeft++;
	//atualiza o progresso
	printProgress();
}

// método para espalhar minas no início de um jogo
function placeMines(x0,y0){
	var n = minesLeft; //número de minas a colocar
	while (n > 0) {
		//escolhe duas coordenadas aleatórias
		var x = Math.floor((Math.random() * boardWidth));
		var y = Math.floor((Math.random() * boardHeight));
		// se o local ainda não tiver uma mina, marcar com -1 e subtrair ao número de minas por colocar
		if (board[y][x] != -1 && x != x0 && y != y0) {
			board[y][x] = -1;
			n --;
		}
	}
	//contagem das minas que rodeiam cada casa
	for (var i = 0; i < boardHeight; i++) {
		for (var j = 0; j < boardWidth; j++) {
			if (board[i][j] != -1) {
				board[i][j] = countNeighbours(i, j, 0);
			}
			popped[i][j] = false; // inicializa todas as células da matriz popped
		}
	}
}

// expande as células vizinhas de (y,x)
function applySearch(y,x,f){
	var strt_i = y, strt_j = x, lm_i = y, lm_j = x;
	//verifica os limites da tabela
	if(x-1 >= 0)
		strt_j = x-1;
	if(x+1 < boardWidth)
		lm_j = x+1;
	if(y-1 >= 0)
		strt_i = y-1;
	if(y+1 < boardHeight)
		lm_i = y+1;
	for(var i = strt_i; i<=lm_i; i++)
		for(var j = strt_j; j<=lm_j; j++){
			if(f === 0 && !popped[i][j])
				expandPop(j,i);
			else if(f === 1 && !popped[i][j] && $("div[data-column='" +j+"'][data-row='"+i+"']").html() != '<i class="fa fa-flag"></i>')
				clickPop(j, i);
		}
}

// método auxiliar para contar bombas nas redondezas de uma célula
function countNeighbours(y, x, f){
	var count = 0;
	var strt_i = y, strt_j = x, lm_i = y, lm_j = x;
	//verifica os limites da tabela
	if(x-1 >= 0)
		strt_j = x-1;
	if(x+1 < boardWidth)
		lm_j = x+1;
	if(y-1 >= 0)
		strt_i = y-1;
	if(y+1 < boardHeight)
		lm_i = y+1;
	for(var i = strt_i; i<=lm_i; i++)
		for(var j = strt_j; j<=lm_j; j++){
			if(f === 0 && board[i][j] === -1)
					count++;
			else if(f === 1 && !popped[i][j] && $("div[data-column='" + j +"'][data-row='"+ i +"']").html() === '<i class="fa fa-flag"></i>')
					count++;
			}
	return count;
}

// revela o conteúdo da célula, alterando o html do botão respetivo
function reveal(x, y){
	var colors = [".", "blue", "green", "red", "purple", "black"];
	//verifica se a célula tem uma bandeira
	if (($("div[data-column='" +x+"'][data-row='"+y+"']").html() === '<i class="fa fa-flag"></i>'))
		increaseMines();
	if (board[y][x] === 0){
		$("div[data-column='" +x+"'][data-row='"+y+"']").html(" "); //se a célula for = 0, mostra botão vazio
	}
	//bomba
	else if (board[y][x] === -1){
		$("div[data-column='" +x+"'][data-row='"+y+"']").html("<i class='fa fa-bomb'></i>"); // se for mina, mostra ícone da mina
	}
	else {
		$("div[data-column='" +x+"'][data-row='"+y+"']").html(board[y][x]); //caso contrário mostra o valor da cela (numero de minas circundantes)
		$("div[data-column='" +x+"'][data-row='"+y+"']").css("color", colors[board[y][x]]);
	}
	//faz disable ao botão
	$("div[data-column='" +x+"'][data-row='"+y+"']").addClass("disable");
}

// função recursiva
function expandPop(x, y){
	//caso não seja uma mina
	if (board[y][x] != -1) {
		reveal(x, y);
		popped[y][x] = true; // marca como rebentada para evitar ciclos infinitos
		 //caso seja zero explode rebenta recursivamente as circundantes
		if (board[y][x] === 0) {
			applySearch(y,x,0);
		}
	}
}

// método que rebenta uma célula, e inicia a recursão
function clickPop(x, y){

	if(firstClick){
		firstClick = false;
		placeMines(x,y);
		timer = setInterval(updateTimer, 1000);
	}

	reveal(x, y);
	popped[y][x] = true;

	if (board[y][x] === 0) //caso seja zero inicia a recursão
			applySearch(y,x,0);

	else if (board[y][x] == -1) { // caso seja uma bomba
		explosion(y,x);
		var audio = new Audio("content/audio/explosion.wav");
		if(sound_on)
			audio.play();
		$("div[data-column='" +x+"'][data-row='"+y+"']").css("color","red"); // marca como vermelho o botão clicado
		revealBombs(); //revela todas as minas
		$("#game-lose").fadeIn();
		endGame(); // termina o jogo
	}
}

// função de acorde
function acorde(x, y){
	if (popped[y][x]){
		var n = board[y][x];
		var nf = countNeighbours(y, x, 1);
		if(board[y][x] === nf)
			applySearch(y, x, 1);
	}
}

// revela todas as bombas quando o jogador perde
function revealBombs(){
	for(var y=0; y<boardHeight; y++){
		for(var x=0; x<boardWidth; x++){
			$("div[data-column='" +x+"'][data-row='"+y+"']").addClass("disable");
			if (board[y][x] === -1)
				$("div[data-column='" +x+"'][data-row='"+y+"']").html("<i class='fa fa-bomb'></i>");
		}
	}
}

// verifica se o jogo terminou com vitória
function checkWin(){

	for (var i = 0; i < boardHeight; i++) {
		for (var j = 0; j < boardWidth; j++) {
			if ((board[i][j] != -1) && (popped[i][j] == false))
				return false;
		}
	}
	return true;
}

function explosion(i, j){
	var canvas = document.createElement('canvas');
	var tmp = (100*(1+i)+j+1);
	canvas.id = '#canvas-'+tmp.toString();
	canvas.width = 30;
	canvas.height = 30;
	$("div[data-column='" +j+"'][data-row='"+i+"']") .html("<i class='fa fa-bomb'></i>");
	//canvas.style.zIndex = "100";

	//canvas = document.getElementById('#canvas');
	var dr = canvas.getContext("2d");
	var frame = 0;
	var anim_id;

	function explosion_anim() {
		dr.clearRect(0, 0, 20, 20);
		if(frame === 5){
			clearInterval(anim_id);

			var final_image = new Image();
			final_image.onmousedown = function(event){
				event.preventDefault();
				return false;
			};
			$("div[data-column='" + j +"'][data-row='"+ i +"']").html("<i class='fa fa-bomb'></i>");
			return;
		}
		dr.drawImage(explosion_image, 39 * frame, 0, 49, 48, 0, 0, 30,30);
		$("div[data-column='" + j +"'][data-row='"+ i +"']").html(canvas);

		frame ++;
	}
	var explosion_image = new Image();
	explosion_image.onload = function(){
		anim_id = setInterval(explosion_anim, 84);
	};
	explosion_image.src = 'content/imgs/hit.png';
}

// fim do jogo
function endGame(){
	clearInterval(timer);
	delete timer;
	isGame = false;
	$("#progress").hide();
	$("#afterGame").show();
}


// *************************************
// VARIÁVEIS MULTIPLAYER
// *************************************
var isMultiplayer = false;
var sse;
var promptTimer;
var multiplayer = {game_id: "", key: "", group: 38, turn: "", opponent: "", level: "", mybombs: 0, opbombs: 0};
var won = false;


// *************************************
// FUNÇÕES MULTIPLAYER
// *************************************

// pedido de registo ao servidor
function register(){
	var xhr = $.ajax({
		type: "POST",
		url: "http://twserver.alunos.dcc.fc.up.pt:8038/register",
		contentType: "application/json",
		data: JSON.stringify({name: username, pass: password}),
		//resposta - erro
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			alert(textStatus);
			alert(errorThrown);
		},
		//resposta - sucesso
		success: function(msg){
			if(msg.error === undefined){
				// mostrar mensagem de sucesso
				promptTimer = setInterval(function(){$("#prompt").fadeOut(); clearInterval(promptTimer);}, 3000);
				$("#ptext").html("Login com sucesso.");
				$("#prompt").fadeIn();

				// esconder menu de login e mostrar menu principal
				$("#login").hide();
				$("#menu").fadeIn();
			}
			else {
				// mostrar mensagem de erro
				$("#usr-error").html("Utilizador registado com senha diferente");
				$("#usr-error").css("color","red");
				$("#usr-error").css("font-style","italic");
				$("#usr-error").fadeIn();
			}
		}
	});
}

// pedido para entrar num jogo
function join(){
	var xhr = $.ajax({
		type: "POST",
   		url: "http://twserver.alunos.dcc.fc.up.pt:8000/join",
		contentType: "application/json",
		data: JSON.stringify({name: username, pass: password, level: multiplayer.level, group: multiplayer.group}),
		//resposta - erro
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			alert(textStatus);
			alert(errorThrown);
        },
    	success: function(msg){
				if(msg.error === undefined){
					multiplayer.game_id = msg.game;
					multiplayer.key = msg.key;
					console.log("JOIN game:"+multiplayer.game_id+" key:"+multiplayer.key);
					$("#start").attr("disabled", true);
					// mostrar mensagem de espera..
					$("#ptext").html("À espera de um oponente...");
					clearInterval(promptTimer);
					$("#prompt").fadeIn();
					// mostrar botão de desistir da espera
					$("#stop-waiting").show();
					initMPGame(); // tentar começar o jogo
				}
				else
					alert(msg.error);
    	}
	});
}

// pedido para desistir de esperar por um jogo
function leave(){
	var xhr = $.ajax({
		type: "POST",
    	url: "http://twserver.alunos.dcc.fc.up.pt:8000/leave",
		contentType: "application/json",
		data: JSON.stringify({name: username, game: multiplayer.game_id, key: multiplayer.key}),
		//resposta - erro
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			alert(textStatus);
			alert(errorThrown);
        },
    	success: function(msg){
				if(msg.error !== undefined)
					alert(msg.error);

    	}
	});
}

// primeiro update, início do jogo multiplayer
function initMPGame(){
	sse = new EventSource( "http://twserver.alunos.dcc.fc.up.pt:8000"+'/update?name=' + username + '&game=' + multiplayer.game_id + '&key=' + multiplayer.key);
	sse.onmessage = function(event){
		var msg = JSON.parse(event.data);

		//sucesso
		if(msg.error === undefined){
			multiplayer.opponent = msg.opponent;
			var ring = true;
			if(multiplayer.turn === msg.turn)
				ring = false;
			multiplayer.turn = msg.turn;

			// esconder menu
			$("#prompt").hide();
			$("#title").hide();
			$("#menu").hide();

			if (multiplayer.level === "beginner"){
				minesLeft = 10;
				boardWidth = 9;
				boardHeight = 9;
			} else if (multiplayer.level === "intermediate"){
				minesLeft = 40;
				boardWidth = 16;
				boardHeight = 16;
			} else if (multiplayer.level === "expert"){
				minesLeft = 99;
				boardWidth = 30;
				boardHeight = 16;
			}

			multiplayer.mybombs = 0;
			multiplayer.opbombs = 0;

			// gerar tabela
			$("#game-board").html(makeTable(boardWidth, boardHeight));
			$("#game-board").css("width", boardWidth*31);
			$("#myName").html(username);
			$("#myscore").html("0");
			$("#opscore").html("0");
			$("#opName").html(multiplayer.opponent);
				if (multiplayer.turn === username) {
					var audio = new Audio("content/audio/turn.wav");
					if(sound_on && ring)
						audio.play();
					$("#myName").addClass("turn");
					$("#opName").removeClass("turn");
					$("#myTurn").html("<i class='fa fa-bomb'></i>");
					$("#opTurn").html("");

				}
				else {
					$("#opName").addClass("turn");
					$("#myName").removeClass("turn");
					$("#opTurn").html("<i class='fa fa-bomb'></i>");
					$("#myTurn").html("");
				}
			$("#mp-progress").fadeIn();
			$("#game-board").fadeIn();
			$("#volume").show();

			// pedir próximo update
			update();
		}
		//ERRO
		else{
			alert(msg.error);
			event.target.close();
		}
	};
}

// pedido para obter atualização
function update(){
	sse.onmessage = function(event){
		var msg = JSON.parse(event.data);
		if(msg.error === undefined){
			//jogada
			if(msg.move !== undefined){
				var cells = msg.move.cells;
				//destapa as células
				for(var i = 0; i < cells.length; i++) {
					var me = (msg.move.name == username);
					mpReveal(cells[i], me);
				}
			}
			//fim do jogo
			if(msg.winner !== undefined){
				event.target.close();
				if(msg.winner === multiplayer.opponent){
					$("#game-lose").fadeIn();
					$("#mpBack").show();
				}
				else {
					won = true;
					$("#game-win").fadeIn();
					$("#stop-waiting").hide();
					$("#mpBack").show();
				}

			}
			if(msg.turn !== undefined) {
				var ring = true;
				if(multiplayer.turn === msg.turn)
					ring = false;
				multiplayer.turn = msg.turn;
				if (multiplayer.turn == username) {
					var audio = new Audio("content/audio/turn.wav");
					if(sound_on && ring)
						audio.play();
					$("#myName").addClass("turn");
					$("#opName").removeClass("turn");
					$("#myTurn").html("<i class='fa fa-bomb'></i>");
					$("#opTurn").html("");

				}
				else {
					$("#opName").addClass("turn");
					$("#myName").removeClass("turn");
					$("#opTurn").html("<i class='fa fa-bomb'></i>");
					$("#myTurn").html("");
				}
			}
			$("#myscore").html(multiplayer.mybombs);
			$("#opscore").html(multiplayer.opbombs);

		 }
		 //ERRO
		else
			alert(msg.error);
	};
}

// descobrir uma célula da tabela
function mpReveal(cell, me){
	var colors = [".", "blue", "green", "red", "purple", "black"];
	var y = cell[0]-1;
	var x = cell[1]-1;
	var count = cell[2];
	if (count === 0){
		$("div[data-column='" +x+"'][data-row='"+y+"']").html(" "); //se a célula for = 0, mostra botão vazio
		$("div[data-column='" +x+"'][data-row='"+y+"']").addClass("disable");
	}
	//bomba
	else if (count === -1){
		explosion(y,x);
		var audio = new Audio("content/audio/explosion.wav");
		if(sound_on)
			audio.play();
		if (me){
			multiplayer.mybombs ++;
			$("div[data-column='" +x+"'][data-row='"+y+"']").addClass("me");
		}
		else{
			multiplayer.opbombs ++;
			$("div[data-column='" +x+"'][data-row='"+y+"']").addClass("opponent");
		}

	}
	//caso contrário mostra o valor da cela (numero de minas circundantes)
	else{
		$("div[data-column='" +x+"'][data-row='"+y+"']").html(count);
		$("div[data-column='" +x+"'][data-row='"+y+"']").addClass("disable");
		$("div[data-column='" +x+"'][data-row='"+y+"']").css("color", colors[count]);

	}

}

// notificar o servidor de uma jogada
function notify(line, column){
	var xhr = $.ajax({
		type: "POST",
		url: "http://twserver.alunos.dcc.fc.up.pt:8000/notify",
		contentType: "application/json",
		data: JSON.stringify({name: username, game: multiplayer.game_id, key: multiplayer.key, row: line+1, col: column+1}),
		error: function(XMLHttpRequest, textStatus, errorThrown){
			alert(textStatus);
			alert(errorThrown);
		},
		success: function(msg){
			//sucesso
			if(msg.error === undefined)
				update(sse);

			//erro
			else
				alert(msg.error);
		}
	});
}

// TODO
function ranking(lvl){
	var xhr = $.ajax({
		type: "POST",
		url: "http://twserver.alunos.dcc.fc.up.pt:8000/ranking",
		contentType: "application/json",
		data: JSON.stringify({level: lvl}),
		error: function(XMLHttpRequest, textStatus, errorThrown){
			alert(textStatus);
			alert(errorThrown);
		},
		success: function(msg){
			//console.log("OK - ranking");
			//sucesso
			if(msg.error === undefined){
				if (lvl=="beginner") honor[3] = msg.ranking;
				else if (lvl=="intermediate") honor[4] = msg.ranking;
				if (lvl=="expert") honor[5] = msg.ranking;
			}
			//erro
			else
				alert(msg.error);
		}
	});
}
// TODO
function score(){
	var shr = $.ajax({
		type: "POST",
		url: "http://twserver.alunos.dcc.fc.up.pt:8000/score",
		contentType: "application/json",
		data: JSON.stringify({name: username, level: multiplayer.level}),
		error: function(XMLHttpRequest, textStatus, errorThrown){
			alert(textStatus);
			alert(errorThrown);
		},
		success: function(msg){
			//console.log(msg.error || "OK - score");
			//sucesso
			if(msg.error === undefined){
				var score = msg.score;
				promptTimer = setInterval(function(){$("#prompt").fadeOut(); clearInterval(promptTimer);}, 3000);
				$("#ptext").html("O seu score é "+score+"!");
				$("#stop-waiting").hide();
				$("#prompt").fadeIn();
			}
			//erro
			else
				alert(msg.error);
		}
	});
}


//*********************************************************//
//************************* JQUERY ************************//

// quando a página carrega
$(document).ready(function() {

	// esconder html desnecessário
	$("#volume").hide();
	$("#prompt").hide();
	$("#stop-waiting").hide();
	$("#mp-progress").hide();
	$("#afterGame").hide();
	$("#mpBack").hide();
	$("#progress").hide();
	$("#menu").hide();
	$("#usr-error").hide();
	$("#honor-scr").hide();
	$("#game-win").hide();
	$("#game-lose").hide();

	//---------- JQuery para o menu de login -------------------
	// quando o utilizador altera username
	$("#usr").on("input", null, null, function() {
		if ($("#usr").val() !== ""){
			// testa para caractéres inválidos
			if (!(/^[a-z0-9_-]+$/i.test($("#usr").val()))) {
				$("#usr-error").html("Caractéres inválidos inseridos.");
				$("#usr-error").fadeIn(); // mostra erro
				$("#login-btn").attr("disabled", true); // faz disable do botão de login
			}
			else { // caso o username seja válido
				$("#usr-error").fadeOut();
				$("#login-btn").attr("disabled", false);
			}
		}
		else { // caso o username esteja vazio
			$("#usr-error").fadeOut();
			$("#login-btn").attr("disabled", true);
		}
	});

	$("#volume").click(function(){
	if(sound_on){
		$("#volume").html('<i class="fa fa-volume-off"></i>');
		sound_on = false;
	}
		else{
		$("#volume").html('<i class="fa fa-volume-up"></i>');
		sound_on = true;
	}
});

	// click no botão de convidado
	$("#convidado").click(function() {
		$("#login").hide();
		$("#menu").fadeIn();
		$("#multiplayer").attr("disabled", true);
		username = "Convidado";
	});

	// click no botão de login
	$("#login-btn").click(function() {
		//credenciais de login
	    username = $("#usr").val();
	    password = $("#pwd").val();
	    $("#start").attr("disabled", false);
		register();
	});


	//---------- JQuery para o menu principal -------------------
	// click no botão de start
	$("#start").click(function() {
		//verifica se o modo multiplayer está selecionado
	  	if($("#multiplayer").is(':checked')){
		    if($('input[name=difficulty]:checked').val() == 1) multiplayer.level = "beginner";
		    else if($('input[name=difficulty]:checked').val() == 2) multiplayer.level = "intermediate";
		    else multiplayer.level = "expert";
		    isMultiplayer = true;
		    // tenta entrar num jogo multiplayer
			join();
	   	}
	   	//singleplayer
		else{
			$("#volume").show();
			isMultiplayer = false;
			$("#menu").hide();
			$("#title").hide();
			$("#progress").fadeIn();
			startGame($('input[name=difficulty]:checked').val()); // início do jogo
			// gera a tabela do jogo
			$("#game-board").html(makeTable(boardWidth, boardHeight));
			$("#game-board").css("width", boardWidth*31); //definir o tamanho do tabuleiro para poder centrar no ecra
			$("#game-board").fadeIn();
		}
	});

	// click no botão de quadro de honra
	$("#honor").click(function() {
		$("#menu").hide();
		//geração do quadro de honra default (singleplayer beginner)
		// mostra 10 elementos melhor classificados
		var t = 0;
		var g = 0;
		$("#honor-tbl").html(makeHonorTable(g, t));
		$("#honor-scr").fadeIn();
	});
	var t = 0;
	var g = 0;


	//---------- JQuery para o quadro de honra -------------------

	//mudança de tabela
	$("#hshow0").click(function() {
			t = 0;
	});
	$("#hshow1").click(function() {
			t = 1;
	});
	$("#hshow2").click(function() {
			t = 2;
	});

	$("#hsingle").click(function() {
			g = 0;
	});
	$("#hmulti").click(function(){
			g = 1;
	});

	//geração de tabela
	$(".hb").click(function() {
		$("#honor-tbl").html(makeHonorTable(g, t));
	});

	// click no botão de voltar atrás
	$("#honor-back").click(function() {
		$("#menu").fadeIn();
		$("#honor-scr").hide();
	});


	//---------- JQuery para o jogo singleplayer-------------------

	// click no botão de desistir
	$("#giveup").click(function() {
		revealBombs();
		endGame();
	});

	//click numa célula da tabela
	var leftButtonDown = false;
	var rightButtonDown = false;
	$("#game-board").on('mousedown', ".board-btn", function(event){
		if (isGame){
	    	switch (event.which) {
		        case 1: // botão esquerdo
		        	leftButtonDown = true;
		        	// coordenadas do click
		        	var x = parseInt($(this).attr('data-column'));
		        	var y = parseInt($(this).attr('data-row'));
		            clickPop(x, y); //rebentar célula
					//acorde
					if((popped[y][x]) && rightButtonDown)
						acorde(x, y);
		            //verificar vitória
		            if (checkWin()) {
									insertHonor({name: username, score: timeSpent}, gameDifficulty); //inserir no quadro de honra
									$("#game-win").fadeIn();
		            	endGame(); //terminar jogo
		            }
		            break;
		        case 3: // botão direito
		        	rightButtonDown = true;
		            var x = parseInt($(this).attr('data-column'));
		        	var y = parseInt($(this).attr('data-row'));
		         	if((popped[y][x]) && leftButtonDown){
						acorde(x, y);
		            	if (checkWin()) {
		            		insertHonor({name: username, score: timeSpent}, gameDifficulty); //inserir no quadro de honra
		            	$("#game-win").fadeIn();
		            		endGame(); //terminar jogo
		            	}
		            }
		            else{
		            if(!($(this).is(":disabled"))){ //se o botão estiver ativo
		            	if (($(this).html() === '') && (minesLeft > 0)){ // se não tiver bandeira ou ponto de interrogação
		            		$(this).html('<i class="fa fa-flag"></i>'); // colocar bandeira
		            		decreaseMines(); //reduzir numero de minas
		            	}
		            	else if ($(this).html() === '<i class="fa fa-flag"></i>'){ //se tiver bandeira
							$(this).html('<i class="fa fa-question"></i>'); //colocar ?
							increaseMines(); //aumentar numero de minas
		            	}
		            	else if ($(this).html() === '<i class="fa fa-question"></i>'){ //se tiver ?
							$(this).html(''); //remover ?
		            	}
		            }
		        }
		            break;
		    }
		}
	});
	//esperar fim de clicks
	$("#game-board").on('mouseup', ".board-btn", function(event){
    	switch (event.which) {
	        case 1: // botão esquerdo
	        	leftButtonDown = false;
	            break;
	        case 3: // botão direito
	        	rightButtonDown = false;
	            break;
	    }
	});

	//------------------ JQuery para a barra de fim do jogo -----------------
	// recomeçar jogo
	$("#restart").click(function(){
		$("#game-win").hide();
		$("#game-lose").hide();
		startGame($('input[name=difficulty]:checked').val());
		$("#afterGame").hide();
		$("#game-board").hide();
		$("#progress").show();
		// criar nova tabela
		$("#game-board").html(makeTable(boardWidth, boardHeight));
		$("#game-board").css("width", boardWidth*31); //definir o tamanho do tabuleiro para poder centrar no ecra
		$("#game-board").fadeIn();
	});

	//voltar para o menu
	$("#backToMenu").click(function(){
		$("#volume").hide();
		$("#game-win").hide();
		$("#game-lose").hide();
		$("#afterGame").hide();
		$("#game-board").hide();
		$("#title").show();
		$("#menu").show();
	});

	$("#mpBack").click(function(){
		$("#volume").hide();
		$("#login-btn").attr("disabled", false);
		$("#game-win").hide();
		$("#game-lose").hide();
		$("#mp-progress").hide();
		$("#game-board").hide();
		$("#mpBack").hide();
		$("#start").attr("disabled", false);
		$("#title").show();
		$("#menu").show();
		score();
		won = false;
	});


	//------------ JQuery Multiplayer --------------------------
	// click no botão de desistir de esperar
	$("#stop-waiting").click(function() {
		$("#prompt").fadeOut();
		leave();
		$("#start").attr("disabled", false);
	});

	// click numa célula do jogo
	$("#game-board").on('mousedown', ".mp-btn", function(event){
		if (multiplayer.turn === username){
	    	switch (event.which) {
		      case 1:
		        var x = parseInt($(this).attr('data-column'));
		        var y = parseInt($(this).attr('data-row'));
		        notify(y, x);
		        break;
		    }
		}
	});
});
