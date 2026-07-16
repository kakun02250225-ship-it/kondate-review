import { setupOptions } from '../data';
import Header from '../components/Header';

function itemName(item) {
  return typeof item === 'string' ? item : item?.name ?? item?.label ?? '';
}

function joinItems(items, emptyLabel = 'なし') {
  if (!Array.isArray(items) || items.length === 0) return emptyLabel;
  return items.map(itemName).filter(Boolean).join('、') || emptyLabel;
}

function firstSetupValue(key, fallback) {
  const source = setupOptions?.[key];
  if (!Array.isArray(source) || source.length === 0) return fallback;
  return itemName(source[0]) || fallback;
}

export default function Settings({
  profile = { age: 20, gender: '回答しない' },
  budget = 18000,
  fridgeItems = ['卵', 'キャベツ', '豚こま肉'],
  allergies = [],
  dislikes = ['パクチー'],
  tastePreferences = ['薄味', 'さっぱり'],
  goals = [firstSetupValue('mealGoals', '健康'), '節約'],
  onEdit,
  onBack,
}) {
  const profileValue = typeof profile === 'string'
    ? profile
    : [profile?.age && `${profile.age}歳`, profile?.gender].filter(Boolean).join('・') || '未設定';
  const budgetValue = typeof budget === 'number'
    ? `月 ¥${budget.toLocaleString('ja-JP')}`
    : budget || '未設定';

  const sections = [
    { id: 'profile', icon: '👤', label: 'プロフィール', value: profileValue },
    { id: 'budget', icon: '¥', label: '食費予算', value: budgetValue },
    { id: 'fridge', icon: '❄️', label: '冷蔵庫の食材', value: joinItems(fridgeItems, '登録なし') },
    { id: 'allergies', icon: '!', label: 'アレルギー', value: joinItems(allergies) },
    { id: 'dislikes', icon: '−', label: '苦手な食材', value: joinItems(dislikes) },
    { id: 'taste', icon: '♡', label: '味の好み', value: joinItems(tastePreferences, '未設定') },
    { id: 'goals', icon: '◎', label: '食事の目的', value: joinItems(goals, '未設定') },
  ];

  return (
    <section className="screen settings-screen" aria-labelledby="settings-title">
      <Header
        title="設定"
        subtitle="登録した内容はいつでも変更できます"
        onBack={onBack}
      />

      <div className="screen-body screen-content">
        <div className="settings-profile-card profile-card">
          <div className="settings-profile-card__avatar profile-avatar" aria-hidden="true">u</div>
          <div>
            <p className="eyebrow">ひとり暮らし献立</p>
            <h1 id="settings-title">userの設定</h1>
            <p>入力内容を献立提案の条件として使用します。</p>
          </div>
        </div>

        <div className="settings-list" aria-label="設定項目">
          {sections.map((section) => (
            <button
              className="settings-row settings-item"
              type="button"
              key={section.id}
              onClick={() => onEdit?.(section.id, section)}
            >
              <span className="settings-row__icon settings-item__icon" aria-hidden="true">{section.icon}</span>
              <span className="settings-row__body settings-item__copy">
                <strong className="settings-item__label">{section.label}</strong>
                <span className="settings-item__value">{section.value}</span>
              </span>
              <span className="settings-row__chevron settings-item__arrow" aria-hidden="true">›</span>
            </button>
          ))}
        </div>

        <div className="tip tip-card">
          <span aria-hidden="true">💡</span>
          <p>ここで変更した内容は、次に献立を作るときから反映されます。</p>
        </div>
      </div>
    </section>
  );
}
