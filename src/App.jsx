import { supabase } from './supabaseClient'

import { useState, useEffect } from 'react'
import './App.css';

const categories = [
 
  { icon: '📹', name: 'كاميرات المراقبة', desc: 'تركيب وصيانة أنظمة CCTV' },
  { icon: '🏗️', name: 'أعمال الألمنيوم', desc: 'أبواب ونوافذ وواجهات' },
  { icon: '⛱️', name: 'المظلات والسواتر', desc: 'مظلات وسواتر بجميع الأنواع' },
  { icon: '🔩', name: 'الحدادة والمعادن', desc: 'أعمال الحدادة والتصنيع' },
  { icon: '♻️', name: 'شراء السكراب', desc: 'شراء المعادن والخردة' },
  { icon: '🛋️', name: 'الأثاث المستعمل', desc: 'شراء وبيع الأثاث المستعمل' },
  { icon: '🔧', name: 'الصيانة المنزلية', desc: 'خدمات الصيانة والإصلاح' },
  { icon: '🏠', name: 'خدمات أخرى', desc: 'اكتشف المزيد من الخدمات' },
];

const businesses = [
  {
    name: 'مؤسسة الأمان للكاميرات',
    category: 'كاميرات المراقبة',
    location: 'الرياض',
    icon: '📹',
    description: 'خدمات تركيب وصيانة كاميرات المراقبة'
  },
  {
    name: 'الألمنيوم الحديث',
    category: 'أعمال الألمنيوم',
    location: 'الرياض',
    icon: '🏗️',
    description: 'أبواب ونوافذ وأعمال الألمنيوم'
  },
  {
    name: 'مظلات الرياض',
    category: 'المظلات والسواتر',
    location: 'الرياض',
    icon: '⛱️',
    description: 'تركيب المظلات والسواتر'
  }
];


function AdminDashboard() {
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')

  const loadBusinesses = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      alert(error.message)
    } else {
      setBusinesses(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadBusinesses()
  }, [])

  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from('businesses')
      .update({ status })
      .eq('id', id)

    if (error) {
      alert(error.message)
    } else {
      await loadBusinesses()
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  const filteredBusinesses = businesses.filter(
    (business) => business.status === activeTab
  )

  return (
    <div dir="rtl" className="register-box">
      <h1>لوحة تحكم المدير</h1>
      <p>إدارة الأنشطة التجارية</p>

      <button onClick={logout}>تسجيل الخروج</button>

      <div className="admin-tabs">
        <button onClick={() => setActiveTab('pending')}>
          قيد الانتظار ({businesses.filter(b => b.status === 'pending').length})
        </button>

        <button onClick={() => setActiveTab('approved')}>
          مقبول ({businesses.filter(b => b.status === 'approved').length})
        </button>

        <button onClick={() => setActiveTab('rejected')}>
          مرفوض ({businesses.filter(b => b.status === 'rejected').length})
        </button>
      </div>

      {loading ? (
        <p>جاري تحميل الطلبات...</p>
      ) : filteredBusinesses.length === 0 ? (
        <p>لا توجد طلبات في هذا القسم.</p>
      ) : (
        filteredBusinesses.map((business) => (
          <div key={business.id} className="business-card">
            <h3>{business.business_name}</h3>
            <p>صاحب النشاط: {business.owner_name}</p>
            <p>الجوال: {business.phone}</p>
            <p>واتساب: {business.whatsapp}</p>
            <p>القسم: {business.category}</p>
            <p>الموقع: {business.location}</p>
            <p>الوصف: {business.description}</p>

            {business.status === 'pending' && (
              <>
                <button onClick={() => updateStatus(business.id, 'approved')}>
                  موافقة
                </button>
                <button onClick={() => updateStatus(business.id, 'rejected')}>
                  رفض
                </button>
              </>
            )}

            {business.status === 'rejected' && (
              <button onClick={() => updateStatus(business.id, 'pending')}>
                إعادة إلى الانتظار
              </button>
            )}
          </div>
        ))
      )}
    </div>
  )
}


function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authMode, setAuthMode] = useState('login')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        setAuthLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const checkAdmin = async () => {
     if (!session) { 
        setIsAdmin(false)
        return
      }

      const { data, error } = await supabase.rpc('is_admin')

      if (error) {
        console.error('Admin check error:', error)
        setIsAdmin(false)
        return
      }

      setIsAdmin(data === true)
    }

    checkAdmin()
  }, [session])
  const [search, setSearch] = useState('');

  const filteredCategories = categories.filter((category) =>
    `${category.name} ${category.desc}`.includes(search.trim())
  );
const testConnection = async () => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .limit(5)

  console.log('Supabase data:', data)
  console.log('Supabase error:', error)
}

testConnection()
if (authLoading) {
  return <div>Loading...</div>
}
const handleAuth = async (e) => {
  e.preventDefault()

  if (authMode === 'signup') {
    const { error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Account created! Please check your email for confirmation.')
    }
  } else {
    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    })

    if (error) {
      alert(error.message)
    }
  }
}
if (!session) {
  return (
    <div className="register-box" dir="ltr">
      <h2>{authMode === 'login' ? 'Admin / Business Login' : 'Create Account'}</h2>

      <form onSubmit={handleAuth}>
        <label>Email</label>
        <input
          type="email"
          required
          value={authEmail}
          onChange={(e) => setAuthEmail(e.target.value)}
          placeholder="Enter your email"
        />

        <label>Password</label>
        <input
          type="password"
          required
          minLength={6}
          value={authPassword}
          onChange={(e) => setAuthPassword(e.target.value)}
          placeholder="Enter your password"
        />

        <button type="submit">
          {authMode === 'login' ? 'Login' : 'Sign Up'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
      >
        {authMode === 'login'
          ? 'Create a new account'
          : 'Already have an account? Login'}
      </button>
    </div>
  )
}
if (isAdmin) {
  return <AdminDashboard />
}
  return (
    <div className="app" dir="rtl">
      <header className="navbar">
        <a className="logo" href="#">
          <span>خ</span>
          خدمات الرياض
        </a>

        <nav>
          <a href="#">الرئيسية</a>
          <a href="#categories">الأقسام</a>
          <a href="#about">من نحن</a>
        </nav>
<a className="add-business" href="#business-register">
  أضف نشاطك التجاري +
</a>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">منصتك الأولى للخدمات في الرياض</span>
            <h1>
              كل الخدمات التي تحتاجها
              <br />
              <span>في مكان واحد</span>
            </h1>
            <p>
              اكتشف أفضل مقدمي الخدمات في الرياض،
              وتواصل معهم بسهولة وثقة.
            </p>

            <div className="search-box">
              <span>🔎</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ما الخدمة التي تبحث عنها؟"
              />
              <button onClick={() => document.getElementById('categories').scrollIntoView()}>
                ابحث الآن
              </button>
            </div>

            <div className="hero-note">
              ✓ خدمات متعددة &nbsp; ✓ مقدمو خدمات مستقلون &nbsp; ✓ الرياض
            </div>
          </div>

          <div className="hero-art">
            <div className="art-circle">🏙️</div>
            <div className="floating-card">📍 الرياض، السعودية</div>
            <div className="floating-card second">✨ خدمات متنوعة</div>
          </div>
        </section>

        <section className="categories" id="categories">
          <div className="section-heading">
            <div>
              <span className="eyebrow">اكتشف خدماتنا</span>
              <h2>تصفح الأقسام</h2>
            </div>
            <p>اختر القسم المناسب لاحتياجك</p>
          </div>

          <div className="category-grid">
            {filteredCategories.map((category) => (
              <div className="category-card" key={category.name}>
                <div className="category-icon">{category.icon}</div>
                <h3>{category.name}</h3>
                <p>{category.desc}</p>
                <span className="card-arrow">←</span>
              </div>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <p className="empty">لم يتم العثور على قسم بهذا الاسم.</p>
          )}
        </section>

<section className="businesses">
  <div className="section-heading">
    <div>
      <span className="eyebrow">مقدمو الخدمات</span>
      <h2>بعض مقدمي الخدمات</h2>
    </div>
    <p>اكتشف الخدمات المتاحة في الرياض</p>
  </div>

  <div className="business-grid">
    {businesses.map((business) => (
      <div className="business-card" key={business.name}>
        <div className="business-icon">{business.icon}</div>
        <h3>{business.name}</h3>
        <p>{business.category}</p>
        <p>📍 {business.location}</p>
        <p>{business.description}</p>
        <span className="demo-label">عرض تجريبي</span>
      </div>
    ))}
  </div>
</section>

<section className="register-section" id="business-register">
  <div className="register-box">
    <span className="eyebrow">انضم إلى منصتنا</span>
    <h2>سجل نشاطك التجاري</h2>
    <p>أضف بيانات نشاطك التجاري ليتمكن العملاء من الوصول إليك.</p>

   
<form onSubmit={async (e) => {
  e.preventDefault()

  if (!session) {
    alert('Please login first.')
    return
  }

  const form = e.currentTarget
  const formData = new FormData(form)

  const business = {
    business_name: formData.get('business_name'),
    owner_name: formData.get('owner_name'),
    phone: formData.get('phone'),
    whatsapp: formData.get('whatsapp'),
    category: formData.get('category'),
    location: formData.get('location'),
    description: formData.get('description'),
    user_id: session.user.id,
    status: 'pending'
  }

  const { error } = await supabase
    .from('businesses')
    .insert([business])

  if (error) {
    alert('Error: ' + error.message)
  } else {
    alert('Your business registration request was submitted!')
    form.reset()
  }
}}>
  <label>اسم النشاط التجاري</label>
  <input name="business_name" required placeholder="أدخل اسم النشاط" />

  <label>اسم صاحب النشاط</label>
  <input name="owner_name" required placeholder="أدخل الاسم" />

  <label>رقم الجوال</label>
  <input name="phone" required type="tel" placeholder="05XXXXXXXX" />

  <label>رقم الواتساب</label>
  <input name="whatsapp" type="tel" placeholder="05XXXXXXXX" />

  <label>القسم</label>
  <select name="category" required defaultValue="">
    <option value="" disabled>اختر القسم</option>
    <option>كاميرات المراقبة</option>
    <option>أعمال الألمنيوم</option>
    <option>المظلات والسواتر</option>
    <option>الحدادة والمعادن</option>
    <option>شراء السكراب</option>
    <option>الأثاث المستعمل</option>
    <option>الصيانة المنزلية</option>
    <option>أخرى</option>
  </select>

  <label>موقع النشاط في الرياض</label>
  <input name="location" required placeholder="مثلاً: شمال الرياض" />

  <label>وصف الخدمات</label>
  <textarea name="description" required placeholder="اكتب تفاصيل خدماتك..." rows="4" />

  <button type="submit">إرسال طلب التسجيل</button>
</form>

  </div>
</section>

        <section className="about" id="about">
          <h2>خدمات الرياض — كل ما تحتاجه بسهولة</h2>
          <p>
            نساعدك في الوصول إلى مقدمي الخدمات والأنشطة التجارية
            المستقلة في مدينة الرياض.
          </p>
        </section>
      </main>

      <footer>
        <strong>خدمات الرياض</strong>
        <p>كل الخدمات في مكان واحد © 2026</p>
      </footer>
    </div>
  );
}

export default App;
