import { useState } from 'react';
import { receiptItems } from '../data';
import Header from '../components/Header';

function itemLabel(item) {
  return typeof item === 'string' ? item : item?.name ?? item?.label ?? '';
}

export default function ReceiptScan({
  items = receiptItems,
  hasScanned,
  onScan,
  onRegister,
  onBack,
}) {
  const [localHasScanned, setLocalHasScanned] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const scanned = hasScanned ?? localHasScanned;
  const scannedItems = items.filter((item) => itemLabel(item));

  const handleScan = () => {
    setIsReading(true);
    if (hasScanned === undefined) setLocalHasScanned(false);

    window.setTimeout(() => {
      if (hasScanned === undefined) setLocalHasScanned(true);
      setIsReading(false);
      onScan?.(scannedItems);
    }, 900);
  };

  return (
    <section className="screen receipt-scan-screen">
      <Header
        title="レシートを読み取る"
        subtitle="買った食材を冷蔵庫にまとめて登録できます"
        onBack={onBack}
      />

      <div className="screen-body screen-content">
        <div className={`camera-card receipt-camera${scanned ? ' camera-card--scanned' : ''}`}>
          <div className="camera-view scan-content" aria-label="レシート読み取りエリア">
            <span className="camera-view__corner camera-view__corner--top-left" aria-hidden="true" />
            <span className="camera-view__corner camera-view__corner--top-right" aria-hidden="true" />
            <span className="camera-view__corner camera-view__corner--bottom-left" aria-hidden="true" />
            <span className="camera-view__corner camera-view__corner--bottom-right" aria-hidden="true" />
            <div className="receipt-preview" aria-hidden="true">
              <span className="receipt-preview__title">RECEIPT</span>
              <span />
              <span />
              <span />
              <span className="receipt-preview__short" />
            </div>
            {isReading && <div className="scan-reading-indicator" aria-hidden="true" />}
            <p className="camera-view__guide">
              {isReading ? '読み取り中です' : scanned ? '読み取りが完了しました' : 'レシートを枠に合わせてください'}
            </p>
          </div>

          <button className="camera-button secondary-button" type="button" onClick={handleScan} disabled={isReading}>
            <span className="camera-button__icon" aria-hidden="true">●</span>
            {isReading ? '読み取り中...' : scanned ? 'もう一度読み取る' : 'レシートを読み取る'}
          </button>
        </div>

        {scanned && !isReading && (
          <section className="info-card scan-result" aria-labelledby="scan-result-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">読み取り結果</p>
                <h2 id="scan-result-title">{scannedItems.length}品を見つけました</h2>
              </div>
              <span className="status-badge">確認済み</span>
            </div>

            <ul className="scan-result__list scan-results">
              {scannedItems.map((item, index) => {
                const label = itemLabel(item);
                const amount = typeof item === 'object' ? item.amount ?? item.quantity : null;

                return (
                  <li className="scan-result-item" key={item?.id ?? `${label}-${index}`}>
                    <span className="scan-result__check" aria-hidden="true">✓</span>
                    <span>{label}</span>
                    {amount && <span className="scan-result__amount">{amount}</span>}
                  </li>
                );
              })}
            </ul>

            <button
              className="button button--primary button--large button--full primary-button full-width"
              type="button"
              onClick={() => onRegister?.(scannedItems)}
            >
              冷蔵庫に登録する
            </button>
            <p className="action-help">登録すると次回の献立条件に利用されます。</p>
          </section>
        )}

        {!scanned && !isReading && (
          <div className="tip tip-card">
            <span aria-hidden="true">💡</span>
            <p>このプロトタイプでは、読み取りボタンを押すとサンプルの読み取り結果を表示します。</p>
          </div>
        )}
      </div>
    </section>
  );
}
