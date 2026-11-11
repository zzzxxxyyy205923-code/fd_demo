/* Same hierarchy as IST: primary admin pages, then views within the current page. */
const PAGES = [
  { key: 'schools', label: '院校详情', hint: '按国家 / 地区维护院校名称、所在地与介绍。', kinds: ['schools_美国', 'schools_英国', 'schools_港新澳', 'schools_欧洲', 'schools_日韩'] },
  { key: 'offers', label: 'Offer 成果', hint: '按国家 / 地区维护录取院校和各申请季数量，前台汇总自动更新。', kinds: ['offers_US', 'offers_UK', 'offers_HK_SG', 'offers_JP', 'offers_EU', 'offers_OTHER'] },
  { key: 'courses', label: '课程内容', hint: '产品介绍管理卡片与详情；课程目录管理单门课程、岗位、海报和 PDF。', kinds: ['products_longform', 'products_catalog', 'products_overseas', 'summerwinter', 'masterclass', 'bizpractice', 'internship'] },
  { key: 'subjects', label: '学科介绍', hint: '维护学科介绍、细分领域与图片。', kinds: ['subjects'] },
  { key: 'resources', label: '校企资源', hint: '维护合作品牌、机构标志与合作内容。', kinds: ['partners'] },
  { key: 'stories', label: '视频故事', hint: '维护故事标题、介绍与视频。', kinds: ['stories'] }
];
const LABELS = {
  offers_US: '美国', offers_UK: '英国', offers_HK_SG: '港新澳', offers_JP: '日韩', offers_EU: '欧洲', offers_OTHER: '其他地区',
  products_longform: '长线产品介绍', products_catalog: '目录产品介绍', products_overseas: '境外项目与留学服务',
  summerwinter: '冬夏校课程', masterclass: '大师课课程', bizpractice: '商业实践项目', internship: '实习岗位'
};
const ADMIN_NAV = [{key:'accounts',href:'admin',label:'账号与权限'}, ...PAGES.map(p=>({key:p.key,href:'admin/'+p.key,label:p.label,editor:true}))];
module.exports = { PAGES, LABELS, ADMIN_NAV };
