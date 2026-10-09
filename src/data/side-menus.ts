export interface MenuItem {
  id: string
  name: string
  timing?: string
}

export interface SideMenuSection {
  id: 'events' | 'festivals'
  title: string
  items: MenuItem[]
}

export const defaultSideMenus: SideMenuSection[] = [
  {
    id: 'events',
    title: 'Events',
    items: [
      { id: 'national-youth-day', name: 'National Youth Day', timing: '12 January' },
      { id: 'national-girl-child-day', name: 'National Girl Child Day', timing: '24 January' },
      { id: 'republic-day', name: 'Republic Day', timing: '26 January' },
      { id: 'national-science-day', name: 'National Science Day', timing: '28 February' },
      { id: 'international-womens-day', name: 'International Women’s Day', timing: '8 March' },
      { id: 'world-water-day', name: 'World Water Day', timing: '22 March' },
      { id: 'world-health-day', name: 'World Health Day', timing: '7 April' },
      { id: 'earth-day', name: 'Earth Day', timing: '22 April' },
      { id: 'international-labour-day', name: 'International Labour Day', timing: '1 May' },
      { id: 'world-environment-day', name: 'World Environment Day', timing: '5 June' },
      { id: 'international-yoga-day', name: 'International Yoga Day', timing: '21 June' },
      { id: 'world-population-day', name: 'World Population Day', timing: '11 July' },
      { id: 'independence-day', name: 'Independence Day', timing: '15 August' },
      { id: 'national-sports-day', name: 'National Sports Day', timing: '29 August' },
      { id: 'teachers-day', name: 'Teachers’ Day', timing: '5 September' },
      { id: 'gandhi-jayanti', name: 'Gandhi Jayanti', timing: '2 October' },
      { id: 'world-mental-health-day', name: 'World Mental Health Day', timing: '10 October' },
      { id: 'childrens-day', name: 'Children’s Day', timing: '14 November' },
      { id: 'world-aids-day', name: 'World AIDS Day', timing: '1 December' },
      { id: 'human-rights-day', name: 'Human Rights Day', timing: '10 December' },
    ],
  },
  {
    id: 'festivals',
    title: 'Festivals',
    items: [
      { id: 'makar-sankranti-pongal', name: 'Makar Sankranti / Pongal', timing: 'January' },
      { id: 'maha-shivaratri', name: 'Maha Shivaratri', timing: 'February or March' },
      { id: 'holi', name: 'Holi', timing: 'February or March' },
      { id: 'eid-al-fitr', name: 'Eid al-Fitr', timing: 'Date varies by lunar calendar' },
      { id: 'ram-navami', name: 'Ram Navami', timing: 'March or April' },
      { id: 'baisakhi', name: 'Baisakhi', timing: 'April' },
      { id: 'rath-yatra', name: 'Rath Yatra', timing: 'June or July' },
      { id: 'raksha-bandhan', name: 'Raksha Bandhan', timing: 'August' },
      { id: 'janmashtami', name: 'Janmashtami', timing: 'August or September' },
      { id: 'ganesh-chaturthi', name: 'Ganesh Chaturthi', timing: 'August or September' },
      { id: 'navratri-durga-puja', name: 'Navratri / Durga Puja', timing: 'September or October' },
      { id: 'dussehra', name: 'Dussehra', timing: 'September or October' },
      { id: 'diwali', name: 'Diwali', timing: 'October or November' },
      { id: 'chhath-puja', name: 'Chhath Puja', timing: 'October or November' },
      { id: 'christmas', name: 'Christmas', timing: '25 December' },
    ],
  },
]

export function createMenuItemId(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`
}
