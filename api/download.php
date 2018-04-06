<?php

$content = $_POST['content'];
header("Content-type:application/octet-stream");
header("Content-Disposition:attachment;filename = download.lrc");
header("Accept-ranges:bytes");
header("Accept-length:".strlen($content));
echo $content;
