# ============================================
# CONFIGURACION - COMPLETA ESTOS VALORES
# ============================================

$CLIENT_ID = "Ad4WnPIu7wqpOlGh4K0fi75Z8ctI2YghpDkgeUs3Zo71Qgey1Yt853ajliNxKpivQfbUEVpHc7US-Hn5"
$CLIENT_SECRET = "EBGGHURD31FNaBWRRLSA_mDFsyh-TW5sCJtdCcnPvjmFZYXKKhOsM6pOi-l93Jzus2ChjZlffPYtEU8p"

$API_BASE = "https://api-m.sandbox.paypal.com"

# ============================================
# NO MODIFICAR ABAJO DE ESTA LINEA
# ============================================

Write-Host "========================================"
Write-Host "SETUP PAYPAL - CoachLatam"
Write-Host "========================================"
Write-Host ""

# ============================================
# PASO 1: Obtener Access Token
# ============================================

Write-Host "Paso 1/3: Obteniendo access token..."
Write-Host ""

$base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${CLIENT_ID}:${CLIENT_SECRET}"))

try {
    $tokenResponse = Invoke-RestMethod -Uri "$API_BASE/v1/oauth2/token" -Method Post -Headers @{"Authorization" = "Basic $base64AuthInfo"; "Accept" = "application/json"; "Accept-Language" = "en_US"} -Body @{"grant_type" = "client_credentials"}

    $ACCESS_TOKEN = $tokenResponse.access_token

    if (-not $ACCESS_TOKEN) {
        Write-Host "ERROR obteniendo token de acceso"
        exit 1
    }

    Write-Host "OK - Token obtenido correctamente"
    Write-Host ""
}
catch {
    Write-Host "ERROR obteniendo token de acceso"
    Write-Host $_.Exception.Message
    exit 1
}

# ============================================
# PASO 2: Crear Producto
# ============================================

Write-Host "Paso 2/3: Creando producto 'CoachLatam Pro Membership'..."
Write-Host ""

$productBody = @{
    name = "CoachLatam Pro Membership"
    description = "Professional coaching platform subscription"
    type = "SERVICE"
    category = "SOFTWARE"
} | ConvertTo-Json

try {
    $productResponse = Invoke-RestMethod -Uri "$API_BASE/v1/catalogs/products" -Method Post -Headers @{"Content-Type" = "application/json"; "Authorization" = "Bearer $ACCESS_TOKEN"} -Body $productBody

    $PRODUCT_ID = $productResponse.id

    if (-not $PRODUCT_ID) {
        Write-Host "ERROR creando producto"
        exit 1
    }

    Write-Host "OK - Producto creado"
    Write-Host "   Product ID: $PRODUCT_ID"
    Write-Host ""
}
catch {
    Write-Host "ERROR creando producto"
    Write-Host $_.Exception.Message
    exit 1
}

# ============================================
# PASO 3: Crear Plan de Suscripcion
# ============================================

Write-Host "Paso 3/3: Creando plan de suscripcion (14.99/mes)..."
Write-Host ""

$planBody = @{
    product_id = $PRODUCT_ID
    name = "CoachLatam Pro - Monthly"
    description = "14.99/month subscription for professional coaches"
    status = "ACTIVE"
    billing_cycles = @(
        @{
            frequency = @{
                interval_unit = "MONTH"
                interval_count = 1
            }
            tenure_type = "REGULAR"
            sequence = 1
            total_cycles = 0
            pricing_scheme = @{
                fixed_price = @{
                    value = "14.99"
                    currency_code = "USD"
                }
            }
        }
    )
    payment_preferences = @{
        auto_bill_outstanding = $true
        setup_fee = @{
            value = "0"
            currency_code = "USD"
        }
        setup_fee_failure_action = "CONTINUE"
        payment_failure_threshold = 3
    }
} | ConvertTo-Json -Depth 10

try {
    $planResponse = Invoke-RestMethod -Uri "$API_BASE/v1/billing/plans" -Method Post -Headers @{"Content-Type" = "application/json"; "Authorization" = "Bearer $ACCESS_TOKEN"} -Body $planBody

    $PLAN_ID = $planResponse.id

    if (-not $PLAN_ID) {
        Write-Host "ERROR creando plan"
        exit 1
    }

    Write-Host "OK - Plan creado"
    Write-Host "   Plan ID: $PLAN_ID"
    Write-Host ""
}
catch {
    Write-Host "ERROR creando plan"
    Write-Host $_.Exception.Message
    exit 1
}

# ============================================
# RESULTADO FINAL
# ============================================

Write-Host "========================================"
Write-Host "TODO LISTO!"
Write-Host "========================================"
Write-Host ""
Write-Host "CREDENCIALES CREADAS:"
Write-Host ""
Write-Host "   Product ID: $PRODUCT_ID"
Write-Host "   Plan ID:    $PLAN_ID"
Write-Host ""
Write-Host "========================================"
Write-Host "VARIABLES DE ENTORNO"
Write-Host "========================================"
Write-Host ""
Write-Host "Copia y pega estas lineas en tu archivo .env.local:"
Write-Host ""
Write-Host "# PayPal Configuration"
Write-Host "NEXT_PUBLIC_PAYPAL_CLIENT_ID=$CLIENT_ID"
Write-Host "PAYPAL_CLIENT_SECRET=$CLIENT_SECRET"
Write-Host "NEXT_PUBLIC_PAYPAL_PLAN_ID=$PLAN_ID"
Write-Host "PAYPAL_API_BASE=https://api-m.sandbox.paypal.com"
Write-Host ""
Write-Host "# Supabase Service Role (obten esto de tu proyecto Supabase)"
Write-Host "SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui"
Write-Host ""
Write-Host "========================================"
Write-Host ""
Write-Host "Proximo paso: Copia las variables de entorno a .env.local"
Write-Host ""