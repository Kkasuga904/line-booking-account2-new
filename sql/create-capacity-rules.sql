-- Capacity Rules Table for Line Booking System
-- 予約制限ルール管理テーブル

CREATE TABLE capacity_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'account-001',
    
    -- 適用範囲 (store|seat_type|seat|menu|staff)
    scope_type TEXT NOT NULL CHECK (scope_type IN ('store', 'seat_type', 'seat', 'menu', 'staff')),
    scope_ids TEXT[], -- 複数対象に対応 (例: ['seat_1', 'seat_2'] or ['cut', 'color'])
    
    -- 日付・時間条件
    date_start TIMESTAMPTZ, -- 開始日時 (nullの場合は無制限)
    date_end TIMESTAMPTZ,   -- 終了日時 (nullの場合は無制限)
    weekdays INTEGER[],     -- 曜日指定 [0=Sunday, 1=Monday, ..., 6=Saturday]
    time_start TIME,        -- 開始時刻
    time_end TIME,          -- 終了時刻
    
    -- 制限内容
    limit_type TEXT NOT NULL CHECK (limit_type IN ('per_hour', 'per_day', 'concurrent', 'stop')),
    limit_value INTEGER,    -- 制限値 (stopの場合はnull)
    
    -- メタデータ
    priority INTEGER DEFAULT 0, -- 優先度 (高いほど優先, 例外ルール用)
    active BOOLEAN DEFAULT true,
    description TEXT,       -- 人間が読める説明文
    rrule TEXT,            -- 将来の拡張用 (RFC5545 RRULE format)
    
    -- 作成・更新情報
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT        -- 作成者 (LINE User ID等)
);

-- インデックス作成
CREATE INDEX idx_capacity_rules_store_id ON capacity_rules(store_id);
CREATE INDEX idx_capacity_rules_active ON capacity_rules(active);
CREATE INDEX idx_capacity_rules_date_range ON capacity_rules(date_start, date_end);
CREATE INDEX idx_capacity_rules_scope ON capacity_rules(scope_type, scope_ids);
CREATE INDEX idx_capacity_rules_priority ON capacity_rules(priority DESC);

-- テスト用サンプルデータ
INSERT INTO capacity_rules (store_id, scope_type, scope_ids, weekdays, time_start, time_end, limit_type, limit_value, description, priority) VALUES
-- 週末ランチタイム制限
('account-001', 'store', NULL, ARRAY[0,6], '11:00', '15:00', 'per_hour', 3, '週末ランチタイム: 1時間あたり3件まで', 0),

-- 平日夕方の集中対策
('account-001', 'store', NULL, ARRAY[1,2,3,4,5], '17:00', '20:00', 'per_hour', 5, '平日夕方: 1時間あたり5件まで', 0),

-- カラー席の制限
('account-001', 'seat_type', ARRAY['color'], NULL, NULL, NULL, 'concurrent', 2, 'カラー席: 同時予約2件まで', 1),

-- 今日だけの緊急制限 (サンプル - 実際は動的に作成)
('account-001', 'store', NULL, NULL, '18:00', '23:59', 'stop', NULL, '本日18時以降: 予約停止', 10);

-- 更新時刻の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_capacity_rules_updated_at BEFORE UPDATE
    ON capacity_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();