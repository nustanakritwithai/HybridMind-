# HYBRID MIND SEO-01.A — READ-ONLY diagnostic probe
# Requires PowerShell 5.1+ on a machine with working DNS / outbound HTTPS.
# Makes anonymous public GET requests only. No credentials, POSTs or settings changes.
# Example: powershell -ExecutionPolicy Bypass -File .\scripts\seo\inspect-public-headers.ps1
param(
    [string]$BaseUrl = "https://hybridmind.online"
)
$ErrorActionPreference = "Stop"
$BaseUrl = $BaseUrl.TrimEnd("/")
$paths = @(
    "/",
    "/2026/10/09/ai-era-2026-agent-tools-a2a/",
    "/2026/10/09/ai-game-development-right-tools-godot-unreal-blender/",
    "/2026/10/09/gs20-smart-glasses-ai-translation-guide/",
    "/robots.txt",
    "/sitemap.xml",
    "/news-sitemap.xml",
    "/wp-sitemap.xml"
)
$results = @()
foreach ($path in $paths) {
    $url = $BaseUrl + $path
    $result = [ordered]@{
        requested_url = $url
        http_status = $null
        final_url = $null
        content_type = $null
        x_robots_tag = $null
        html_meta_robots = $null
        is_xml_sitemap = $false
        has_wordpress_not_found_title = $false
        error = $null
    }
    try {
        $response = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 25 -MaximumRedirection 5 -UseBasicParsing -Headers @{ "Cache-Control" = "no-cache" }
        $result.http_status = [int]$response.StatusCode
        $result.final_url = [string]$response.BaseResponse.ResponseUri
        $result.content_type = [string]$response.Headers["Content-Type"]
        $result.x_robots_tag = [string]$response.Headers["X-Robots-Tag"]
        $body = [string]$response.Content
        if ($body -match '(?is)<meta\s+[^>]*name=["'']robots["''][^>]*>') {
            $result.html_meta_robots = $Matches[0]
        }
        $result.is_xml_sitemap = ($body -match '(?is)^\s*(<\?xml[^>]*>\s*)?<(urlset|sitemapindex)\b')
        $result.has_wordpress_not_found_title = ($body -match 'ไม่พบหน้า')
    } catch {
        $result.error = [string]$_.Exception.Message
        if ($null -ne $_.Exception.Response) {
            try { $result.http_status = [int]$_.Exception.Response.StatusCode } catch {}
            try { $result.x_robots_tag = [string]$_.Exception.Response.Headers["X-Robots-Tag"] } catch {}
            try { $result.content_type = [string]$_.Exception.Response.Headers["Content-Type"] } catch {}
        }
    }
    $results += [pscustomobject]$result
}
$report = [ordered]@{
    audit = "HYBRIDMIND-SEO01A"
    checked_utc = [DateTime]::UtcNow.ToString("o")
    note = "Anonymous user-agent tests only. Does not prove Googlebot/Bingbot/OAI-SearchBot access or Google indexing."
    results = $results
}
$report | ConvertTo-Json -Depth 6
