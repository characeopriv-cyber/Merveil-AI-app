export const LANGUAGE_REGISTRY = [
  {id:'python',name:'Python',family:'general-purpose',status:'native',runtimes:['CPython'],frameworks:['FastAPI','Django','Flask','Pydantic'],package_manager:'pip',extensions:['.py'],sectors:['ai-llm','ai-agents','computer-vision','data-engineering','analytics','science-research','web','backend','automation'],providers:['OpenAI','Anthropic','Google Gemini','AWS','Microsoft Azure','Google Cloud']},
  {id:'java',name:'Java',family:'jvm',status:'native',runtimes:['JVM'],frameworks:['Spring Boot','Quarkus','Micronaut'],package_manager:'Maven/Gradle',extensions:['.java'],sectors:['enterprise','backend','banking','fintech','government','android'],providers:['AWS','Microsoft Azure','Google Cloud']},
  {id:'javascript',name:'JavaScript',family:'web',status:'native',runtimes:['Node.js','Bun','Deno'],frameworks:['Next.js','React','Express','NestJS'],package_manager:'npm/pnpm/yarn',extensions:['.js','.mjs','.cjs'],sectors:['web','ecommerce','social','community','marketplaces','backend'],providers:['Vercel','Cloudflare','AWS']},
  {id:'typescript',name:'TypeScript',family:'web',status:'native',runtimes:['Node.js','Bun','Deno'],frameworks:['Next.js','React','NestJS','Express'],package_manager:'npm/pnpm/yarn',extensions:['.ts','.tsx'],sectors:['web','saas','ai-agents','ecommerce','social','marketplaces','backend'],providers:['Vercel','Cloudflare','AWS']},
  {id:'c',name:'C',family:'systems',status:'supported',runtimes:['GCC','Clang'],frameworks:['CMake'],package_manager:'system',extensions:['.c','.h'],sectors:['embedded-iot','robotics','systems','telecom'],providers:['AWS','Microsoft Azure','Google Cloud']},
  {id:'cpp',name:'C++',family:'systems',status:'supported',runtimes:['GCC','Clang','MSVC'],frameworks:['CMake','Unreal Engine'],package_manager:'vcpkg/Conan',extensions:['.cpp','.hpp'],sectors:['3d-games','2d-games','ar-vr','robotics','embedded-iot','systems'],providers:['Unreal Engine','AWS','NVIDIA']},
  {id:'csharp',name:'C#',family:'dotnet',status:'native',runtimes:['.NET'],frameworks:['Unity','ASP.NET Core','Blazor'],package_manager:'NuGet',extensions:['.cs'],sectors:['3d-games','2d-games','ar-vr','enterprise','backend','web'],providers:['Unity','Microsoft Azure','Vercel']},
  {id:'go',name:'Go',family:'systems',status:'native',runtimes:['Go'],frameworks:['Gin','Fiber','Echo'],package_manager:'Go Modules',extensions:['.go'],sectors:['backend','cloud','devops','devops','telecom','microservices'],providers:['AWS','Google Cloud','Cloudflare']},
  {id:'rust',name:'Rust',family:'systems',status:'supported',runtimes:['Rust'],frameworks:['Axum','Actix Web','Tokio'],package_manager:'Cargo',extensions:['.rs'],sectors:['systems','backend','cloud','blockchain','webassembly','embedded-iot'],providers:['AWS','Cloudflare','Google Cloud']},
  {id:'kotlin',name:'Kotlin',family:'jvm',status:'native',runtimes:['JVM','Android'],frameworks:['Android SDK','Ktor','Spring Boot'],package_manager:'Gradle',extensions:['.kt','.kts'],sectors:['android','backend','enterprise'],providers:['Google Cloud','AWS','Microsoft Azure']},
  {id:'swift',name:'Swift',family:'apple',status:'supported',runtimes:['Swift'],frameworks:['SwiftUI','Vapor'],package_manager:'Swift Package Manager',extensions:['.swift'],sectors:['ios','macos','mobile'],providers:['Apple','AWS','Vercel']},
  {id:'dart',name:'Dart',family:'mobile',status:'native',runtimes:['Dart VM'],frameworks:['Flutter'],package_manager:'pub',extensions:['.dart'],sectors:['mobile','web','desktop'],providers:['Firebase','Google Cloud','AWS']},
  {id:'php',name:'PHP',family:'web',status:'supported',runtimes:['PHP'],frameworks:['Laravel','Symfony'],package_manager:'Composer',extensions:['.php'],sectors:['web','ecommerce','cms'],providers:['Vercel','AWS','Cloudflare']},
  {id:'ruby',name:'Ruby',family:'web',status:'supported',runtimes:['Ruby'],frameworks:['Ruby on Rails','Sinatra'],package_manager:'Bundler',extensions:['.rb'],sectors:['web','saas','ecommerce'],providers:['AWS','Vercel','Cloudflare']},
  {id:'scala',name:'Scala',family:'jvm',status:'setup_required',runtimes:['JVM'],frameworks:['Akka','Play Framework'],package_manager:'sbt',extensions:['.scala'],sectors:['data-engineering','backend','enterprise'],providers:['AWS','Databricks','Google Cloud']},
  {id:'r',name:'R',family:'data',status:'setup_required',runtimes:['R'],frameworks:['Shiny','tidyverse'],package_manager:'CRAN',extensions:['.r','.R'],sectors:['data-engineering','analytics','science-research'],providers:['Databricks','AWS','Google Cloud']},
  {id:'julia',name:'Julia',family:'data',status:'setup_required',runtimes:['Julia'],frameworks:['Genie.jl','Flux.jl'],package_manager:'Pkg',extensions:['.jl'],sectors:['science-research','data-engineering','analytics','ai-llm'],providers:['AWS','Google Cloud','Microsoft Azure']},
  {id:'lua',name:'Lua',family:'scripting',status:'setup_required',runtimes:['Lua'],frameworks:['LÖVE','OpenResty'],package_manager:'LuaRocks',extensions:['.lua'],sectors:['2d-games','scripting','embedded-iot'],providers:['AWS','Cloudflare']},
  {id:'perl',name:'Perl',family:'scripting',status:'setup_required',runtimes:['Perl'],frameworks:['Mojolicious'],package_manager:'CPAN',extensions:['.pl','.pm'],sectors:['automation','web','systems'],providers:['AWS']},
  {id:'haskell',name:'Haskell',family:'functional',status:'setup_required',runtimes:['GHC'],frameworks:['Servant','Yesod'],package_manager:'Cabal/Stack',extensions:['.hs'],sectors:['backend','systems','science-research'],providers:['AWS','Google Cloud']},
  {id:'elixir',name:'Elixir',family:'functional',status:'setup_required',runtimes:['BEAM'],frameworks:['Phoenix','LiveView'],package_manager:'Mix',extensions:['.ex','.exs'],sectors:['web','realtime','communications'],providers:['Fly.io','AWS','Google Cloud']},
  {id:'erlang',name:'Erlang',family:'functional',status:'setup_required',runtimes:['BEAM'],frameworks:['OTP'],package_manager:'rebar3',extensions:['.erl','.hrl'],sectors:['realtime','telecom','communications'],providers:['AWS','Google Cloud']},
  {id:'objective-c',name:'Objective-C',family:'apple',status:'setup_required',runtimes:['Apple SDK'],frameworks:['UIKit','Foundation'],package_manager:'Xcode',extensions:['.m','.h'],sectors:['ios','macos'],providers:['Apple']},
  {id:'matlab',name:'MATLAB',family:'scientific',status:'setup_required',runtimes:['MATLAB'],frameworks:['Simulink'],package_manager:'MATLAB Toolbox',extensions:['.m','.mlx'],sectors:['science-research','engineering','robotics'],providers:['MathWorks']},
  {id:'solidity',name:'Solidity',family:'blockchain',status:'setup_required',runtimes:['EVM'],frameworks:['Hardhat','Foundry'],package_manager:'npm',extensions:['.sol'],sectors:['blockchain','crypto-web3'],providers:['Ethereum/Alchemy','Coinbase','Chainlink']},
  {id:'sql',name:'SQL',family:'database',status:'native',runtimes:['PostgreSQL','MySQL','SQLite'],frameworks:['PostgreSQL','Supabase'],package_manager:'database',extensions:['.sql'],sectors:['data-engineering','analytics','backend','database'],providers:['Supabase','AWS','Google Cloud']},
  {id:'bash',name:'Bash',family:'scripting',status:'native',runtimes:['Bash'],frameworks:['GNU/Linux'],package_manager:'system',extensions:['.sh'],sectors:['devops','cloud','automation'],providers:['AWS','Google Cloud','Cloudflare']},
  {id:'powershell',name:'PowerShell',family:'scripting',status:'supported',runtimes:['PowerShell'],frameworks:['PowerShell Core'],package_manager:'PowerShell Gallery',extensions:['.ps1'],sectors:['devops','cloud','enterprise','automation'],providers:['Microsoft Azure','AWS','GitHub Actions']},
  {id:'gdscript',name:'GDScript',family:'game',status:'native',runtimes:['Godot'],frameworks:['Godot'],package_manager:'Godot Asset Library',extensions:['.gd'],sectors:['2d-games','3d-games','ar-vr'],providers:['Godot','PlayFab','AWS']}
];

export function languageCatalog(language='') {
  if (!language) return LANGUAGE_REGISTRY;
  return LANGUAGE_REGISTRY.find(x=>x.id===String(language).toLowerCase()) || null;
}

export function languagesForSector(sector='') {
  if (!sector) return LANGUAGE_REGISTRY;
  const key=String(sector).toLowerCase();
  return LANGUAGE_REGISTRY.filter(x=>x.sectors.includes(key));
}
