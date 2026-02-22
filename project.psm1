function route {
    param(
        [ValidateSet("create", "remove")]
        [string] $mode,
        [string] $name
    );

    if ($mode -eq "create")
    {
        new-item("$name.html");
        new-item("scripts/$name.js");
        new-item("styles/$name.css");

        $conteudo = @"
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <link rel="stylesheet" href="styles/$name.css">
</head>
<body>
    
    <script src="scripts/$name.js"></script>
</body>
</html>
"@
        set-content(-path "$name.html", -value $conteudo);
    }
    elseif ($mode -eq "remove")
    {
        remove-item("$name.html");
        remove-item("scripts/$name.js");
        remove-item("styles/$name.css");
    }

    return(0);
}

function deactivate {
    param();

    Remove-Module project

    return(0);
}