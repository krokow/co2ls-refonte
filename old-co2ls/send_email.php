<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer-master/src/Exception.php';
require 'PHPMailer-master/src/PHPMailer.php';
require 'PHPMailer-master/src/SMTP.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $fullname = htmlspecialchars($_POST['name']);
    $email = htmlspecialchars($_POST['email']);
    $message = htmlspecialchars($_POST['message']);

    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'co2laserservice@gmail.com';
        $mail->Password = 'tewy skdz jcab thue';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        $mail->setFrom('co2laserservice@gmail.com', 'Formulaire de contact CO2LS');
        $mail->addAddress('website@co2ls.fr', 'Website CO2LS');

        $mail->isHTML(true);
        $mail->CharSet = 'UTF-8';
        $mail->Subject = "Nouveau message de contact";
        $mail->Body    = "
            <h2>Informations fournies dans le formulaire</h2>
            <p><strong>Nom & Prénom : </strong> $fullname</p>
            <p><strong>Email : </strong> $email</p>
            <p><strong>Message : </strong></p>
            <p>$message</p>
        ";
        $mail->AltBody = "Nom & Prénom : $fullname\nEmail : $email\nMessage : $message";

        $mail->send();
        echo 'L\'email a été envoyé avec succès';
    } catch (Exception $e) {
        echo "L'envoi de l'email a échoué. Erreur: {$mail->ErrorInfo}";
    }
} else {
    echo 'Méthode de requête non supportée.';
}
