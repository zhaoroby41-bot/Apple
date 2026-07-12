import { mockDataset } from "./data/mockData";

export default function App() {
  return (
    <main className="app-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Apple Social Operations</p>
          <h1>小红书与抖音运营数据看板</h1>
        </div>
        <div className="header-stat">
          <span>经销商</span>
          <strong>{mockDataset.dealers.length}</strong>
        </div>
        <div className="header-stat">
          <span>门店账号</span>
          <strong>{mockDataset.accounts.length}</strong>
        </div>
      </section>
    </main>
  );
}
