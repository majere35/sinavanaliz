import type { AppData } from '../../domain/types';
import { Seg } from '../common';
import { GroupBoard } from '../GroupBoard';
import { RaceBoard } from '../RaceBoard';
import { Shapes } from '../Shapes';

export type GroupView = 'group' | 'race';

interface Props {
  data: AppData;
  view: GroupView;
  onViewChange(v: GroupView): void;
  onPresent(v: GroupView): void;
}

export function GroupPage({ data, view, onViewChange, onPresent }: Props) {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Grup</h1>
          <p>Tüm danışan öğrenciler birlikte — genel bakış ve eğlenceli net yarışı.</p>
        </div>
        <div className="spacer" />
        <Seg<GroupView>
          value={view}
          options={[
            { value: 'group', label: '👥 Genel bakış' },
            { value: 'race', label: '🏁 Yarış' },
          ]}
          onChange={onViewChange}
        />
        <button className="btn orange" onClick={() => onPresent(view)}>
          ▶ Sunumda aç
        </button>
      </div>
      <div className="stage panel-stage">
        <Shapes />
        {view === 'group' ? <GroupBoard data={data} /> : <RaceBoard data={data} />}
      </div>
    </div>
  );
}
