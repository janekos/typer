<?php

$file_title = "scores.txt";

//faili sisu
$entries_from_file = file_get_contents($file_title);

$entries = json_decode($entries_from_file);

if(isset($_GET["name"]) && isset($_GET["score"])){
  if(!empty($_GET["name"]) && !empty($_GET["score"])){
    //lihtne objekt
    $object = new stdClass();
    $object->name = $_GET["name"];
    $object->score = $_GET["score"];;

    //lisan objekti massiivi
    array_push($entries, $object);

    //Teen stringiks
    $json_string = json_encode($entries);

    //salvestan faili üle
    file_put_contents($file_title, $json_string);
  }
}
//trükin välja stringi kujul massiivi (võib olla lisas midagi juurde)
echo(json_encode($entries));

?>
