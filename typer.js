var TYPER = function(){

	//singleton
    if (TYPER.instance_) {
        return TYPER.instance_;
    }
    TYPER.instance_ = this;

	// Muutujad
	this.WIDTH = window.innerWidth;
	this.HEIGHT = window.innerHeight;
	this.canvas = null;
	this.ctx = null;

	this.words = []; // kõik sõnad
	this.word = null; // preagu arvamisel olev sõna
	this.word_min_length = 3;
	this.guessed_words = 0; // nö skoor
  this.mistakes = 0;

  this.routes = TYPER.routes;
  this.current_route = null;
  this.players = [];

	//mängija objekt, hoiame nime ja skoori
	this.player = {name: null, score: 0, errors: 0};

	this.init();
};

window.TYPER = TYPER;

TYPER.routes = {
  'game': {
    'render': function(){
      // käivitame siis kui lehte laeme
      console.log('>>>>mang');
    }
  },
  'highscore': {
    'render': function(){
      console.log('>>>>skoorid');
    }
  }
};

TYPER.prototype = {

	// Funktsioon, mille käivitame alguses
	init: function(){

		// küsime mänigja andmed
		this.loadPlayerData();

    //iseseisevtyy
    if(!window.location.hash){
      window.location.hash = 'game';
    }
    console.log(window.location.hash);
    if(window.location.hash === '#game'){
      document.getElementById("game").style.display = "block";
      document.getElementById("highscore").style.display = "none";
    }else{
      document.getElementById("game").style.display = "none";
      document.getElementById("highscore").style.display = "block";
    }

		// Lisame canvas elemendi ja contexti
		this.canvas = document.getElementsByTagName('canvas')[0];
		this.ctx = this.canvas.getContext('2d');

		// canvase laius ja kõrgus veebisirvija akna suuruseks (nii style, kui reso)
		this.canvas.style.width = this.WIDTH + 'px';
		this.canvas.style.height = this.HEIGHT + 'px';

		//reso
		this.canvas.width = this.WIDTH;
		this.canvas.height = this.HEIGHT;

		// laeme sõnad
		this.loadWords();
	}, // init end

	loadPlayerData: function(){

		// küsime mängija nime ja muudame objektis nime
		var p_name = prompt("Sisesta mängija nimi");

		// Kui ei kirjutanud nime või jättis tühjaks
		if(p_name === null || p_name === ""){
			p_name = "Tundmatu";
			// tegelikult võiks ka uuesti küsida
		}

		// Mänigja objektis muudame nime
		this.player.name = p_name; // player =>>> {name:"Romil", score: 0}
        console.log(this.player);
		this.players.push(this.player);
	}, // loadPlayerData end

	loadWords: function(){

        console.log('loading...');

		// AJAX http://www.w3schools.com/ajax/tryit.asp?filename=tryajax_first
		var xmlhttp = new XMLHttpRequest();

		// määran mis juhtub, kui saab vastuse
		xmlhttp.onreadystatechange = function(){

            // OLULINE TYPER tuleb siia funktsiooni kaasa saata võtta instance_'i kaudu
            var TYPER_ref = TYPER.instance_;

			//console.log(xmlhttp.readyState); //võib teoorias kõiki staatuseid eraldi käsitleda

			// Sai faili tervenisti kätte
			if(xmlhttp.readyState == 4 && xmlhttp.status == 200){

                console.log('successfully loaded');

				// serveri vastuse sisu
				var response = xmlhttp.responseText;
				//console.log(response);

				// tekitame massiivi, faili sisu aluseks, uue sõna algust märgib reavahetuse \n
				var words_from_file = response.split('\n');
				//console.log(words_from_file);

				//asendan massiivi
				TYPER_ref.words = structureArrayByWordLength(words_from_file);
				//console.log(TYPER_ref.words);

				// kõik sõnad olemas, alustame mänguga
				TYPER_ref.start();
			}
		};

		xmlhttp.open('GET','./lemmad2013.txt',true);
		xmlhttp.send();
	}, // loadWords end

	start: function(){

		// Tekitame sõna objekti Word
		this.generateWord();
		//console.log(this.word);

        //joonista sõna
		this.word.Draw(this.guessed_words, this.mistakes);

		// Kuulame klahvivajutusi
		window.addEventListener('keypress', this.keyPressed.bind(this));

	}, //start end
    generateWord: function(){

        // kui pikk peab sõna tulema, + min pikkus + äraarvatud sõnade arvul jääk 5 jagamisel
        var generated_word_length =  this.word_min_length + parseInt(this.guessed_words/5);

    	// Saan suvalise arvu vahemikus 0 - (massiivi pikkus -1)
    	var random_index = (Math.random()*(this.words[generated_word_length].length-1)).toFixed();

        // random sõna, mille salvestame siia algseks
    	var word = this.words[generated_word_length][random_index];

        this.word = new Word(word, this.canvas, this.ctx);
    },
	keyPressed: function(event){

		//console.log(event);
		// event.which annab koodi ja fromcharcode tagastab tähe
		var letter = String.fromCharCode(event.which);
		//console.log(letter);

		// Võrdlen kas meie kirjutatud täht on sama mis järele jäänud sõna esimene
		//console.log(TYPER.word);
		if(letter === this.word.left.charAt(0)){

			// Võtame ühe tähe maha
			this.word.removeFirstLetter();

			// kas sõna sai otsa, kui jah - loosite uue sõna

			if(this.word.left.length === 0){

				this.guessed_words += 1;

                //update player score
                this.player.score = this.guessed_words;

				//loosin uue sõna
				this.generateWord();
			}

			//joonistan uuesti
			this.word.Draw(this.guessed_words, this.mistakes);
		}else{

      this.mistakes += 1;

      this.player.errors = this.mistakes;

      this.word.Draw(this.guessed_words, this.mistakes);
	  
	  this.loadHighScore(this.guessed_words, this.mistakes);
    }

	}, // keypress end
	
	loadHighScore: function(score, error){
		if(error>9){
			alert("Mäng on läbi! Teie skoor on "+score+" punkti.");
			
			document.getElementById("game").style.display = "none";
			document.getElementById("highscore").style.display = "block";
			
			this.addNewScore();
			
			this.loadData();
		}
	},
	
	loadData: function(){
		
		var xhttp = new XMLHttpRequest();

          xhttp.onreadystatechange = function() {

           if (xhttp.readyState == 4 && xhttp.status == 200) {
             var result = JSON.parse(xhttp.responseText);
             console.log(result);

             TYPER.instance_.createListFromArray(result);
             console.log('laadisin serverist');
           }
         };

         xhttp.open("GET", "saveData.php", true);
         xhttp.send();

    },
	   
	createListFromArray: function(arrayOfObjects){

       this.scores = arrayOfObjects;

       //tekitan loendi htmli
       this.scores.forEach(function(score1){
         var new_score = new Score(score1.name, score1.score);

         var li = new_score.createHtmlElement();
		 
         document.querySelector('.high_scores').appendChild(li);
       });

    },
	
	addNewScore: function(){

       var name = this.players[0].name;
       var score = this.players[0].score;
       
       var new_score = new Score(name, score);
       //document.querySelector('.high_scores').appendChild(new_score.createHtmlElement());
       //this.players.push(new_score);

       var xhttp = new XMLHttpRequest();
       xhttp.onreadystatechange = function() {
       if (xhttp.readyState == 4 && xhttp.status == 200) {

			console.log('salvestas serverisse');
            var result =xhttp.responseText;
            console.log(result);


          }
       };
       console.log("saveData.php?name="+name+"&score="+score);
       xhttp.open("GET", "saveData.php?name="+name+"&score="+score, true);
       xhttp.send();
     }

};

var Score = function(player, score){
     this.player = player;
     this.score = score;
     console.log('created new score');
   };

Score.prototype = {
     createHtmlElement: function(){

       var li = document.createElement('li');

       var span1 = document.createElement('span');
       span1.className = 'content';

       var content = document.createTextNode(this.player + ' | ' + this.score +'   ');
       span1.appendChild(content);

       li.appendChild(span1);

       return li;

     },
   };


// Sõna objekt
function Word(word, canvas, ctx){

    this.word = word;
    // liskas sõna järel, mida hakkame hakkima
	this.left = this.word;

    this.canvas = canvas;
    this.ctx = ctx;
}

Word.prototype = {
	Draw: function(score, errors){

		//Tühjendame canvase
		this.ctx.clearRect( 0, 0, this.canvas.width, this.canvas.height);

		// Canvasele joonistamine
		this.ctx.textAlign = 'center';
		this.ctx.font = '70px Courier';

		// 	// Joonistame sõna, mis on järel / tekst, x, y
		this.ctx.fillText(this.left, this.canvas.width/2, this.canvas.height/2);

    //skoor
    this.ctx.textAlign = 'left';
    this.ctx.font = '40px Courier';
    this.ctx.fillText("skoor: "+score, 50, 50);

    //errorid
    this.ctx.textAlign = 'left';
    this.ctx.font = '40px Courier';
    this.ctx.fillText("vigu: "+errors, 50, 90);
	},

	// Võtame sõnast esimese tähe maha
	removeFirstLetter: function(){

		// Võtame esimese tähe sõnast maha
		this.left = this.left.slice(1);
		//console.log(this.left);
	}
};

/* HELPERS */
function structureArrayByWordLength(words){
    //TEEN massiivi ümber, et oleksid jaotatud pikkuse järgi
    // NT this.words[3] on kõik kolmetähelised

    // defineerin ajutise massiivi, kus kõik on õiges jrk
    var temp_array = [];

    // Käime läbi kõik sõnad
    for(var i = 0; i < words.length; i++){

        var word_length = words[i].length;

        // Kui pole veel seda array'd olemas, tegu esimese just selle pikkusega sõnaga
        if(temp_array[word_length] === undefined){
            // Teen uue
            temp_array[word_length] = [];
        }

        // Lisan sõna juurde
        temp_array[word_length].push(words[i]);
    }

    return temp_array;
}

window.onload = function(){
	var typer = new TYPER();
};
