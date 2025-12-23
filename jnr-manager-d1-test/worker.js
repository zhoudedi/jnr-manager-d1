//这个是后台api地址访问地址是：jnr-api.lvxin.xn--6qq986b3xl
// worker.js - 使用新Worker URL和jnr_db数据库
// worker.js - 管理员登录API实现
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS 头部
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 获取所有情侣数据
      if (path === '/api/data' && request.method === 'GET') {
        const { results } = await env.jnr_db.prepare(
          `SELECT id, male_name, male_qq, male_birth, female_name, female_qq, female_birth, anniversary FROM couples ORDER BY id`
        ).all();
        
        // 转换数据格式以兼容现有前端
        const formattedData = results.map(row => ({
          id: row.id,
          male: {
            name: row.male_name,
            qq: row.male_qq,
            birth: row.male_birth
          },
          female: {
            name: row.female_name,
            qq: row.female_qq,
            birth: row.female_birth
          },
          anniversary: row.anniversary
        }));
        
        return new Response(JSON.stringify(formattedData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
	  
	   // 根据ID获取单个情侣数据
      if (path.startsWith('/api/data/') && request.method === 'GET') {
        const id = parseInt(path.split('/')[3]);
        const { results } = await env.jnr_db.prepare(
          `SELECT id, male_name, male_qq, male_birth, female_name, female_qq, female_birth, anniversary FROM couples WHERE id = ?`
        ).bind(id).all();
        
        if (results.length === 0) {
          return new Response(JSON.stringify({ error: '未找到对应情侣信息' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // 转换数据格式以兼容现有前端
        const row = results[0];
        const formattedData = {
          id: row.id,
          male: {
            name: row.male_name,
            qq: row.male_qq,
            birth: row.male_birth
          },
          female: {
            name: row.female_name,
            qq: row.female_qq,
            birth: row.female_birth
          },
          anniversary: row.anniversary
        };
        
        return new Response(JSON.stringify(formattedData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
	  
	  
      // 添加情侣数据
      if (path === '/api/add' && request.method === 'POST') {
        const password = url.searchParams.get('password');
        if (password !== 'xiaozhou') {
          return new Response(JSON.stringify({ error: '认证失败' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const body = await request.json();
        
        const stmt = env.jnr_db.prepare(
          `INSERT INTO couples (male_name, male_qq, male_birth, female_name, female_qq, female_birth, anniversary) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        );
        
        const result = await stmt.bind(
          body.male.name,
          body.male.qq,
          body.male.birth,
          body.female.name,
          body.female.qq,
          body.female.birth,
          body.anniversary
        ).run();
        
        return new Response(JSON.stringify({ 
          success: true, 
          id: result.meta.last_row_id 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 更新情侣数据
      if (path.startsWith('/api/update/') && request.method === 'PUT') {
        const id = parseInt(path.split('/')[3]);
        const password = url.searchParams.get('password');
        if (password !== 'xiaozhou') {
          return new Response(JSON.stringify({ error: '认证失败' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const body = await request.json();
        
        const stmt = env.jnr_db.prepare(
          `UPDATE couples 
           SET male_name = ?, male_qq = ?, male_birth = ?, 
               female_name = ?, female_qq = ?, female_birth = ?, 
               anniversary = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`
        );
        
        await stmt.bind(
          body.male.name,
          body.male.qq,
          body.male.birth,
          body.female.name,
          body.female.qq,
          body.female.birth,
          body.anniversary,
          id
        ).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 删除情侣数据
      if (path.startsWith('/api/delete/') && request.method === 'DELETE') {
        const id = parseInt(path.split('/')[3]);
        const password = url.searchParams.get('password');
        if (password !== 'xiaozhou') {
          return new Response(JSON.stringify({ error: '认证失败' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const stmt = env.jnr_db.prepare(`DELETE FROM couples WHERE id = ?`);
        await stmt.bind(id).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 添加情侣数据
      if (path === '/api/adds' && request.method === 'POST') {
        // 验证管理员身份
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: '未提供认证信息' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const token = authHeader.substring(7); // 移除 "Bearer " 前缀
        if (token !== 'admin_token_placeholder') {
          return new Response(JSON.stringify({ error: '认证失败' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const body = await request.json();
        
        const stmt = env.jnr_db.prepare(
          `INSERT INTO couples (male_name, male_qq, male_birth, female_name, female_qq, female_birth, anniversary) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        );
        
        const result = await stmt.bind(
          body.male.name,
          body.male.qq,
          body.male.birth,
          body.female.name,
          body.female.qq,
          body.female.birth,
          body.anniversary
        ).run();
        
        return new Response(JSON.stringify({ 
          success: true, 
          id: result.meta.last_row_id 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 更新情侣数据
      if (path.startsWith('/api/updates/') && request.method === 'PUT') {
        // 验证管理员身份
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: '未提供认证信息' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const token = authHeader.substring(7); // 移除 "Bearer " 前缀
        if (token !== 'admin_token_placeholder') {
          return new Response(JSON.stringify({ error: '认证失败' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const id = parseInt(path.split('/')[3]);
        const body = await request.json();
        
        const stmt = env.jnr_db.prepare(
          `UPDATE couples 
           SET male_name = ?, male_qq = ?, male_birth = ?, 
               female_name = ?, female_qq = ?, female_birth = ?, 
               anniversary = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`
        );
        
        await stmt.bind(
          body.male.name,
          body.male.qq,
          body.male.birth,
          body.female.name,
          body.female.qq,
          body.female.birth,
          body.anniversary,
          id
        ).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 删除情侣数据
      if (path.startsWith('/api/deletes/') && request.method === 'DELETE') {
        // 验证管理员身份
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: '未提供认证信息' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const token = authHeader.substring(7); // 移除 "Bearer " 前缀
        if (token !== 'admin_token_placeholder') {
          return new Response(JSON.stringify({ error: '认证失败' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const id = parseInt(path.split('/')[3]);
        const stmt = env.jnr_db.prepare(`DELETE FROM couples WHERE id = ?`);
        await stmt.bind(id).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 管理员登录验证
      if (path === '/api/login' && request.method === 'POST') {
        const body = await request.json();
        const { username, password } = body;
        
        // 从数据库中验证管理员用户
        const stmt = env.jnr_db.prepare(
          `SELECT id, username, password_hash FROM admin_users WHERE username = ?`
        );
        const result = await stmt.bind(username).first();
        
        if (result) {
          // 这里我们简化了密码验证逻辑，实际应用中应使用bcrypt等库进行密码哈希比较
          // 简单比较密码（实际应用中应使用安全的哈希验证）
          if (username === 'admin' && password === 'xiaozhou') {
            return new Response(JSON.stringify({ 
              success: true,
              token: 'admin_token_placeholder' // 实际应用中应使用JWT
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }
        
        return new Response(JSON.stringify({ error: '用户名或密码错误' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response('404啦休想盗窃后台数据 没有当前访问页面 禁止玩火哦！', { status: 404 });
    } catch (e) {
      console.error('Error:', e);
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },
};