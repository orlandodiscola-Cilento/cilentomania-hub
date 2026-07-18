param(
  [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

$configPath = Join-Path $ProjectRoot 'seo\seo.config.json'
$routesPath = Join-Path $ProjectRoot 'seo\routes.json'
$config = Get-Content -Raw -LiteralPath $configPath | ConvertFrom-Json
$manifest = Get-Content -Raw -LiteralPath $routesPath | ConvertFrom-Json
$baseUrl = $config.baseUrl.TrimEnd('/')

$urlNodes = foreach ($route in $manifest.routes | Where-Object { $_.sitemap }) {
  $sourcePath = Join-Path $ProjectRoot $route.source
  if (-not (Test-Path -LiteralPath $sourcePath)) { throw "Sorgente della rotta non trovata: $($route.source)" }
  $lastModified = (Get-Item -LiteralPath $sourcePath).LastWriteTimeUtc.ToString('yyyy-MM-dd')
  "  <url><loc>$baseUrl$($route.path)</loc><lastmod>$lastModified</lastmod><changefreq>$($route.changeFrequency)</changefreq><priority>$($route.priority)</priority></url>"
}

$sitemap = @('<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">') + $urlNodes + '</urlset>'
Set-Content -LiteralPath (Join-Path $ProjectRoot 'sitemap.xml') -Value $sitemap -Encoding utf8

$robots = @('User-agent: *','Allow: /','',"Sitemap: $baseUrl/sitemap.xml")
Set-Content -LiteralPath (Join-Path $ProjectRoot 'robots.txt') -Value $robots -Encoding utf8

Write-Output "Generati robots.txt e sitemap.xml da seo/seo.config.json e seo/routes.json"
