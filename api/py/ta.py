import json
import yfinance as yf
import pandas as pd
import pandas_ta as ta
from datetime import datetime, timedelta

def handler(request):
    """Vercel serverless function handler for technical analysis."""
    
    # Parse query parameters
    query = request.get('queryStringParameters', {}) or {}
    ticker = query.get('ticker', '').upper()
    
    if not ticker:
        return {
            'statusCode': 400,
            'body': json.dumps({'success': False, 'error': 'Ticker parameter required'}),
            'headers': {'Content-Type': 'application/json'}
        }
    
    # Auto-append .JK for Indonesian stocks
    if '.' not in ticker:
        ticker = f"{ticker}.JK"
    
    try:
        # Fetch 1 year of daily data
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365)
        
        stock = yf.Ticker(ticker)
        df = stock.history(start=start_date, end=end_date, interval='1d')
        
        if df.empty:
            return {
                'statusCode': 404,
                'body': json.dumps({'success': False, 'error': f'No data found for {ticker}'}),
                'headers': {'Content-Type': 'application/json'}
            }
        
        # Reset index to make Date a column
        df = df.reset_index()
        df['Date'] = df['Date'].dt.strftime('%Y-%m-%d')
        
        # ─────────────────────────────────────────────────────────────
        # CALCULATE TECHNICAL INDICATORS
        # ─────────────────────────────────────────────────────────────
        
        # Trend Indicators
        df['SMA_20'] = ta.sma(df['Close'], length=20)
        df['SMA_50'] = ta.sma(df['Close'], length=50)
        df['SMA_200'] = ta.sma(df['Close'], length=200)
        df['EMA_12'] = ta.ema(df['Close'], length=12)
        df['EMA_26'] = ta.ema(df['Close'], length=26)
        
        # VWAP (Volume Weighted Average Price)
        df['VWAP'] = ta.vwap(df['High'], df['Low'], df['Close'], df['Volume'])
        
        # Momentum Indicators
        df['RSI_14'] = ta.rsi(df['Close'], length=14)
        
        # MACD
        macd = ta.macd(df['Close'], fast=12, slow=26, signal=9)
        if macd is not None:
            df['MACD'] = macd['MACD_12_26_9']
            df['MACD_signal'] = macd['MACDs_12_26_9']
            df['MACD_hist'] = macd['MACDh_12_26_9']
        
        # Stochastic
        stoch = ta.stoch(df['High'], df['Low'], df['Close'], k=14, d=3)
        if stoch is not None:
            df['STOCH_K'] = stoch['STOCHk_14_3_3']
            df['STOCH_D'] = stoch['STOCHd_14_3_3']
        
        # Williams %R
        df['WILLR'] = ta.willr(df['High'], df['Low'], df['Close'], length=14)
        
        # CCI (Commodity Channel Index)
        df['CCI'] = ta.cci(df['High'], df['Low'], df['Close'], length=20)
        
        # Volatility Indicators
        # Bollinger Bands
        bbands = ta.bbands(df['Close'], length=20, std=2)
        if bbands is not None:
            df['BB_upper'] = bbands['BBU_20_2.0']
            df['BB_middle'] = bbands['BBM_20_2.0']
            df['BB_lower'] = bbands['BBL_20_2.0']
            df['BB_width'] = bbands['BBB_20_2.0']
        
        # ATR (Average True Range)
        df['ATR'] = ta.atr(df['High'], df['Low'], df['Close'], length=14)
        
        # Keltner Channel
        kc = ta.kc(df['High'], df['Low'], df['Close'], length=20, scalar=2)
        if kc is not None:
            df['KC_upper'] = kc['KCU_20_2.0']
            df['KC_lower'] = kc['KCL_20_2.0']
        
        # Volume Indicators
        df['OBV'] = ta.obv(df['Close'], df['Volume'])
        df['CMF'] = ta.cmf(df['High'], df['Low'], df['Close'], df['Volume'], length=20)
        df['MFI'] = ta.mfi(df['High'], df['Low'], df['Close'], df['Volume'], length=14)
        
        # ADX (Average Directional Index) - Trend Strength
        adx = ta.adx(df['High'], df['Low'], df['Close'], length=14)
        if adx is not None:
            df['ADX'] = adx['ADX_14']
            df['DI_plus'] = adx['DMP_14']
            df['DI_minus'] = adx['DMN_14']
        
        # ─────────────────────────────────────────────────────────────
        # GENERATE DETAILED ANALYSIS
        # ─────────────────────────────────────────────────────────────
        
        analysis = generate_analysis(df, ticker)
        
        # Prepare OHLCV data for chart
        ohlcv = []
        for _, row in df.iterrows():
            candle = {
                'time': row['Date'],
                'open': round(row['Open'], 2),
                'high': round(row['High'], 2),
                'low': round(row['Low'], 2),
                'close': round(row['Close'], 2),
                'volume': int(row['Volume']) if pd.notna(row['Volume']) else 0
            }
            ohlcv.append(candle)
        
        # Prepare indicator data for chart overlays
        indicators = prepare_indicators(df)
        
        # Get latest values summary
        latest = df.iloc[-1]
        latest_summary = {
            'price': round(latest['Close'], 2),
            'change': round(latest['Close'] - df.iloc[-2]['Close'], 2) if len(df) > 1 else 0,
            'change_pct': round(((latest['Close'] - df.iloc[-2]['Close']) / df.iloc[-2]['Close']) * 100, 2) if len(df) > 1 else 0,
            'volume': int(latest['Volume']) if pd.notna(latest['Volume']) else 0,
            'sma_20': round(latest['SMA_20'], 2) if pd.notna(latest['SMA_20']) else None,
            'sma_50': round(latest['SMA_50'], 2) if pd.notna(latest['SMA_50']) else None,
            'sma_200': round(latest['SMA_200'], 2) if pd.notna(latest['SMA_200']) else None,
            'rsi': round(latest['RSI_14'], 2) if pd.notna(latest['RSI_14']) else None,
            'macd': round(latest['MACD'], 4) if pd.notna(latest.get('MACD')) else None,
            'macd_signal': round(latest['MACD_signal'], 4) if pd.notna(latest.get('MACD_signal')) else None,
            'bb_upper': round(latest['BB_upper'], 2) if pd.notna(latest.get('BB_upper')) else None,
            'bb_lower': round(latest['BB_lower'], 2) if pd.notna(latest.get('BB_lower')) else None,
            'atr': round(latest['ATR'], 2) if pd.notna(latest.get('ATR')) else None,
            'adx': round(latest['ADX'], 2) if pd.notna(latest.get('ADX')) else None,
        }
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'ticker': ticker,
                'count': len(ohlcv),
                'data': ohlcv,
                'indicators': indicators,
                'latest': latest_summary,
                'analysis': analysis
            }, default=str),
            'headers': {
                'Content-Type': 'application/json',
                'Cache-Control': 's-maxage=300, stale-while-revalidate=60'
            }
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'success': False, 'error': str(e)}),
            'headers': {'Content-Type': 'application/json'}
        }


def prepare_indicators(df):
    """Prepare indicator data for chart overlays."""
    indicators = {
        'sma': [],
        'ema': [],
        'bb': [],
        'rsi': [],
        'macd': [],
        'volume_ma': []
    }
    
    for _, row in df.iterrows():
        time = row['Date']
        
        # SMA/EMA
        sma_point = {'time': time}
        if pd.notna(row.get('SMA_20')):
            sma_point['sma_20'] = round(row['SMA_20'], 2)
        if pd.notna(row.get('SMA_50')):
            sma_point['sma_50'] = round(row['SMA_50'], 2)
        if pd.notna(row.get('SMA_200')):
            sma_point['sma_200'] = round(row['SMA_200'], 2)
        indicators['sma'].append(sma_point)
        
        # EMA
        ema_point = {'time': time}
        if pd.notna(row.get('EMA_12')):
            ema_point['ema_12'] = round(row['EMA_12'], 2)
        if pd.notna(row.get('EMA_26')):
            ema_point['ema_26'] = round(row['EMA_26'], 2)
        indicators['ema'].append(ema_point)
        
        # Bollinger Bands
        bb_point = {'time': time}
        if pd.notna(row.get('BB_upper')):
            bb_point['upper'] = round(row['BB_upper'], 2)
            bb_point['middle'] = round(row['BB_middle'], 2)
            bb_point['lower'] = round(row['BB_lower'], 2)
        indicators['bb'].append(bb_point)
        
        # RSI
        rsi_point = {'time': time}
        if pd.notna(row.get('RSI_14')):
            rsi_point['value'] = round(row['RSI_14'], 2)
        indicators['rsi'].append(rsi_point)
        
        # MACD
        macd_point = {'time': time}
        if pd.notna(row.get('MACD')):
            macd_point['macd'] = round(row['MACD'], 4)
            macd_point['signal'] = round(row['MACD_signal'], 4)
            macd_point['histogram'] = round(row['MACD_hist'], 4)
        indicators['macd'].append(macd_point)
    
    return indicators


def generate_analysis(df, ticker):
    """Generate detailed technical analysis with signals and recommendations."""
    
    if len(df) < 50:
        return {'error': 'Insufficient data for analysis'}
    
    latest = df.iloc[-1]
    prev = df.iloc[-2] if len(df) > 1 else latest
    price = latest['Close']
    
    analysis = {
        'ticker': ticker,
        'timestamp': datetime.now().isoformat(),
        'price': round(price, 2),
        'signals': {},
        'summary': {},
        'recommendations': []
    }
    
    # ═══════════════════════════════════════════════════════════════
    # TREND ANALYSIS
    # ═══════════════════════════════════════════════════════════════
    
    trend_signals = []
    trend_score = 0
    
    # Price vs Moving Averages
    sma_20 = latest.get('SMA_20')
    sma_50 = latest.get('SMA_50')
    sma_200 = latest.get('SMA_200')
    
    if sma_20:
        if price > sma_20:
            trend_signals.append(f"Price above SMA-20 ({round(sma_20, 2)}) — Short-term bullish")
            trend_score += 1
        else:
            trend_signals.append(f"Price below SMA-20 ({round(sma_20, 2)}) — Short-term bearish")
            trend_score -= 1
    
    if sma_50:
        if price > sma_50:
            trend_signals.append(f"Price above SMA-50 ({round(sma_50, 2)}) — Medium-term bullish")
            trend_score += 1
        else:
            trend_signals.append(f"Price below SMA-50 ({round(sma_50, 2)}) — Medium-term bearish")
            trend_score -= 1
    
    if sma_200:
        if price > sma_200:
            trend_signals.append(f"Price above SMA-200 ({round(sma_200, 2)}) — Long-term uptrend")
            trend_score += 2
        else:
            trend_signals.append(f"Price below SMA-200 ({round(sma_200, 2)}) — Long-term downtrend")
            trend_score -= 2
    
    # Golden/Death Cross
    if sma_50 and sma_200:
        prev_sma_50 = prev.get('SMA_50')
        prev_sma_200 = prev.get('SMA_200')
        if prev_sma_50 and prev_sma_200:
            if sma_50 > sma_200 and prev_sma_50 <= prev_sma_200:
                trend_signals.append("⚠️ GOLDEN CROSS detected — Strong bullish signal")
                trend_score += 3
            elif sma_50 < sma_200 and prev_sma_50 >= prev_sma_200:
                trend_signals.append("⚠️ DEATH CROSS detected — Strong bearish signal")
                trend_score -= 3
    
    # Moving Average Crossovers
    ema_12 = latest.get('EMA_12')
    ema_26 = latest.get('EMA_26')
    if ema_12 and ema_26:
        if ema_12 > ema_26:
            trend_signals.append("EMA-12 above EMA-26 — Bullish momentum")
            trend_score += 1
        else:
            trend_signals.append("EMA-12 below EMA-26 — Bearish momentum")
            trend_score -= 1
    
    analysis['signals']['trend'] = {
        'score': trend_score,
        'signals': trend_signals,
        'direction': 'bullish' if trend_score > 0 else 'bearish' if trend_score < 0 else 'neutral'
    }
    
    # ═══════════════════════════════════════════════════════════════
    # MOMENTUM ANALYSIS
    # ═══════════════════════════════════════════════════════════════
    
    momentum_signals = []
    momentum_score = 0
    
    # RSI Analysis
    rsi = latest.get('RSI_14')
    prev_rsi = prev.get('RSI_14')
    
    if pd.notna(rsi):
        if rsi > 70:
            momentum_signals.append(f"RSI ({round(rsi, 1)}) — OVERBOUGHT zone, potential reversal")
            momentum_score -= 2
        elif rsi < 30:
            momentum_signals.append(f"RSI ({round(rsi, 1)}) — OVERSOLD zone, potential bounce")
            momentum_score += 2
        elif rsi > 60:
            momentum_signals.append(f"RSI ({round(rsi, 1)}) — Bullish momentum")
            momentum_score += 1
        elif rsi < 40:
            momentum_signals.append(f"RSI ({round(rsi, 1)}) — Bearish momentum")
            momentum_score -= 1
        else:
            momentum_signals.append(f"RSI ({round(rsi, 1)}) — Neutral zone")
        
        # RSI Divergence (simplified)
        if pd.notna(prev_rsi):
            if price > prev['Close'] and rsi < prev_rsi:
                momentum_signals.append("⚠️ Bearish RSI divergence detected")
                momentum_score -= 1
            elif price < prev['Close'] and rsi > prev_rsi:
                momentum_signals.append("⚠️ Bullish RSI divergence detected")
                momentum_score += 1
    
    # MACD Analysis
    macd = latest.get('MACD')
    macd_signal = latest.get('MACD_signal')
    macd_hist = latest.get('MACD_hist')
    prev_macd_hist = prev.get('MACD_hist')
    
    if pd.notna(macd) and pd.notna(macd_signal):
        if macd > macd_signal:
            momentum_signals.append(f"MACD above signal line — Bullish")
            momentum_score += 1
        else:
            momentum_signals.append(f"MACD below signal line — Bearish")
            momentum_score -= 1
        
        # MACD Crossover
        if pd.notna(prev_macd_hist) and pd.notna(macd_hist):
            if prev_macd_hist < 0 and macd_hist > 0:
                momentum_signals.append("⚠️ BULLISH MACD crossover — Buy signal")
                momentum_score += 2
            elif prev_macd_hist > 0 and macd_hist < 0:
                momentum_signals.append("⚠️ BEARISH MACD crossover — Sell signal")
                momentum_score -= 2
        
        # Histogram momentum
        if pd.notna(macd_hist):
            if macd_hist > 0:
                momentum_signals.append(f"MACD histogram positive ({round(macd_hist, 4)}) — Uptrend")
            else:
                momentum_signals.append(f"MACD histogram negative ({round(macd_hist, 4)}) — Downtrend")
    
    # Stochastic Analysis
    stoch_k = latest.get('STOCH_K')
    stoch_d = latest.get('STOCH_D')
    
    if pd.notna(stoch_k):
        if stoch_k > 80:
            momentum_signals.append(f"Stochastic %K ({round(stoch_k, 1)}) — Overbought")
            momentum_score -= 1
        elif stoch_k < 20:
            momentum_signals.append(f"Stochastic %K ({round(stoch_k, 1)}) — Oversold")
            momentum_score += 1
        
        if pd.notna(stoch_d):
            if stoch_k > stoch_d:
                momentum_signals.append("Stochastic bullish — %K above %D")
            else:
                momentum_signals.append("Stochastic bearish — %K below %D")
    
    analysis['signals']['momentum'] = {
        'score': momentum_score,
        'signals': momentum_signals,
        'direction': 'bullish' if momentum_score > 0 else 'bearish' if momentum_score < 0 else 'neutral'
    }
    
    # ═══════════════════════════════════════════════════════════════
    # VOLATILITY ANALYSIS
    # ═══════════════════════════════════════════════════════════════
    
    volatility_signals = []
    volatility_score = 0
    
    # Bollinger Bands
    bb_upper = latest.get('BB_upper')
    bb_lower = latest.get('BB_lower')
    bb_width = latest.get('BB_width')
    
    if pd.notna(bb_upper) and pd.notna(bb_lower):
        bb_range = bb_upper - bb_lower
        bb_position = (price - bb_lower) / bb_range if bb_range > 0 else 0.5
        
        if price > bb_upper:
            volatility_signals.append(f"Price above upper Bollinger Band — Overextended")
            volatility_score -= 1
        elif price < bb_lower:
            volatility_signals.append(f"Price below lower Bollinger Band — Oversold")
            volatility_score += 1
        elif bb_position > 0.8:
            volatility_signals.append(f"Price near upper BB ({round(bb_position*100, 0)}% position)")
        elif bb_position < 0.2:
            volatility_signals.append(f"Price near lower BB ({round(bb_position*100, 0)}% position)")
        else:
            volatility_signals.append(f"Price within Bollinger Bands ({round(bb_position*100, 0)}% position)")
        
        # Squeeze detection
        if pd.notna(bb_width) and bb_width < 5:
            volatility_signals.append("⚠️ Bollinger Band SQUEEZE — Potential breakout incoming")
    
    # ATR Analysis
    atr = latest.get('ATR')
    if pd.notna(atr):
        atr_pct = (atr / price) * 100
        if atr_pct > 3:
            volatility_signals.append(f"High volatility — ATR {round(atr_pct, 2)}% of price")
        elif atr_pct < 1:
            volatility_signals.append(f"Low volatility — ATR {round(atr_pct, 2)}% of price")
        else:
            volatility_signals.append(f"Normal volatility — ATR {round(atr_pct, 2)}% of price")
    
    analysis['signals']['volatility'] = {
        'score': volatility_score,
        'signals': volatility_signals,
        'direction': 'high_volatility' if volatility_score < 0 else 'low_volatility' if volatility_score > 0 else 'normal'
    }
    
    # ═══════════════════════════════════════════════════════════════
    # VOLUME ANALYSIS
    # ═══════════════════════════════════════════════════════════════
    
    volume_signals = []
    volume_score = 0
    
    volume = latest['Volume']
    avg_volume = df['Volume'].rolling(20).mean().iloc[-1] if len(df) >= 20 else volume
    
    if pd.notna(avg_volume) and avg_volume > 0:
        vol_ratio = volume / avg_volume
        
        if vol_ratio > 2:
            volume_signals.append(f"Volume {round(vol_ratio, 1)}x average — Unusually high activity")
            volume_score += 2
        elif vol_ratio > 1.5:
            volume_signals.append(f"Volume {round(vol_ratio, 1)}x average — Above normal")
            volume_score += 1
        elif vol_ratio < 0.5:
            volume_signals.append(f"Volume {round(vol_ratio, 1)}x average — Low activity")
            volume_score -= 1
        else:
            volume_signals.append(f"Volume {round(vol_ratio, 1)}x average — Normal")
        
        # Volume + Price action
        price_change = price - prev['Close']
        if price_change > 0 and vol_ratio > 1.2:
            volume_signals.append("Rising price with high volume — Bullish confirmation")
            volume_score += 1
        elif price_change < 0 and vol_ratio > 1.2:
            volume_signals.append("Falling price with high volume — Bearish confirmation")
            volume_score -= 1
    
    # OBV Analysis
    obv = latest.get('OBV')
    obv_20 = df['OBV'].rolling(20).mean().iloc[-1] if len(df) >= 20 and 'OBV' in df else None
    
    if pd.notna(obv) and pd.notna(obv_20):
        if obv > obv_20:
            volume_signals.append("OBV above 20-day average — Accumulation")
            volume_score += 1
        else:
            volume_signals.append("OBV below 20-day average — Distribution")
            volume_score -= 1
    
    # CMF (Chaikin Money Flow)
    cmf = latest.get('CMF')
    if pd.notna(cmf):
        if cmf > 0.25:
            volume_signals.append(f"CMF ({round(cmf, 2)}) — Strong buying pressure")
            volume_score += 1
        elif cmf < -0.25:
            volume_signals.append(f"CMF ({round(cmf, 2)}) — Strong selling pressure")
            volume_score -= 1
        else:
            volume_signals.append(f"CMF ({round(cmf, 2)}) — Neutral money flow")
    
    analysis['signals']['volume'] = {
        'score': volume_score,
        'signals': volume_signals,
        'direction': 'bullish' if volume_score > 0 else 'bearish' if volume_score < 0 else 'neutral'
    }
    
    # ═══════════════════════════════════════════════════════════════
    # TREND STRENGTH (ADX)
    # ═══════════════════════════════════════════════════════════════
    
    adx = latest.get('ADX')
    di_plus = latest.get('DI_plus')
    di_minus = latest.get('DI_minus')
    
    adx_signals = []
    adx_score = 0
    
    if pd.notna(adx):
        if adx > 40:
            adx_signals.append(f"ADX ({round(adx, 1)}) — Very strong trend")
            adx_score += 2
        elif adx > 25:
            adx_signals.append(f"ADX ({round(adx, 1)}) — Strong trend")
            adx_score += 1
        elif adx > 20:
            adx_signals.append(f"ADX ({round(adx, 1)}) — Developing trend")
        else:
            adx_signals.append(f"ADX ({round(adx, 1)}) — Weak/no trend (ranging)")
            adx_score -= 1
        
        # Direction
        if pd.notna(di_plus) and pd.notna(di_minus):
            if di_plus > di_minus:
                adx_signals.append(f"+DI > -DI — Trend direction: UP")
                adx_score += 1
            else:
                adx_signals.append(f"+DI < -DI — Trend direction: DOWN")
                adx_score -= 1
    
    analysis['signals']['trend_strength'] = {
        'score': adx_score,
        'signals': adx_signals,
        'direction': 'strong' if adx_score > 1 else 'weak' if adx_score < 0 else 'moderate'
    }
    
    # ═══════════════════════════════════════════════════════════════
    # OVERALL SUMMARY & RECOMMENDATIONS
    # ═══════════════════════════════════════════════════════════════
    
    total_score = (trend_score + momentum_score + volume_score) / 3
    
    if total_score >= 2:
        overall = "STRONG BULLISH"
        action = "BUY"
    elif total_score >= 1:
        overall = "BULLISH"
        action = "BUY / HOLD"
    elif total_score >= 0.5:
        overall = "SLIGHTLY BULLISH"
        action = "HOLD / ACCUMULATE"
    elif total_score <= -2:
        overall = "STRONG BEARISH"
        action = "SELL"
    elif total_score <= -1:
        overall = "BEARISH"
        action = "SELL / AVOID"
    elif total_score <= -0.5:
        overall = "SLIGHTLY BEARISH"
        action = "HOLD / REDUCE"
    else:
        overall = "NEUTRAL"
        action = "HOLD / WAIT"
    
    analysis['summary'] = {
        'overall': overall,
        'action': action,
        'score': round(total_score, 2),
        'confidence': 'high' if abs(total_score) > 1.5 else 'medium' if abs(total_score) > 0.5 else 'low'
    }
    
    # Generate specific recommendations
    recommendations = []
    
    if 'SELL' in action:
        recommendations.append({
            'type': 'warning',
            'text': f'Consider reducing positions or setting tight stop-losses for {ticker}'
        })
    elif 'BUY' in action:
        recommendations.append({
            'type': 'opportunity',
            'text': f'{ticker} shows bullish signals — consider accumulating on pullbacks'
        })
    
    # Entry/Exit zones based on Bollinger Bands
    if pd.notna(bb_lower) and pd.notna(bb_upper):
        recommendations.append({
            'type': 'info',
            'text': f'Entry zone: {round(bb_lower, 0)} - {round(sma_20, 0) if pd.notna(sma_20) else round(bb_lower * 1.02, 0)}'
        })
        recommendations.append({
            'type': 'info',
            'text': f'Resistance zone: {round(bb_upper, 0)} - {round(bb_upper * 1.02, 0)}'
        })
    
    # Stop loss suggestion based on ATR
    if pd.notna(atr):
        stop_loss = price - (atr * 2)
        recommendations.append({
            'type': 'risk',
            'text': f'Suggested stop-loss: {round(stop_loss, 0)} (2x ATR below current price)'
        })
    
    analysis['recommendations'] = recommendations
    
    return analysis
